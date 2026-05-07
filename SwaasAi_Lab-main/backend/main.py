"""
Firebase Cloud Functions for Swaas AI Backend
==============================================
Handles:
- Health report processing
- Gemini API integration
- Push notifications
- Admin analytics
"""

import functions_framework
from firebase_functions import firestore_fn, https_fn, scheduler_fn
from firebase_admin import initialize_app, firestore, storage
import google.generativeai as genai
import os
from datetime import datetime, timedelta
import json

# Initialize Firebase
initialize_app()
db = firestore.client()

# Configure Gemini API
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
genai.configure(api_key=GEMINI_API_KEY)

@https_fn.on_request()
def analyze_health_data(req: https_fn.Request) -> https_fn.Response:
    """
    HTTP function to analyze health data.
    Receives lung sound features + symptoms, returns analysis.
    """
    # Enable CORS
    if req.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600',
        }
        return https_fn.Response('', headers=headers, status=204)
    
    headers = {'Access-Control-Allow-Origin': '*'}
    
    try:
        data = req.get_json()
        
        # Extract data
        audio_features = data.get('audioFeatures', {})
        symptoms = data.get('symptoms', [])
        patient_data = data.get('patientData', {})
        
        # Process with Gemini for enhanced analysis
        symptom_text = ', '.join(symptoms)
        prompt = f"""
        Analyze these respiratory symptoms and provide insights:
        Symptoms: {symptom_text}
        Patient Age: {patient_data.get('age', 'unknown')}
        Duration: {patient_data.get('duration', 'unknown')}
        Smoking: {patient_data.get('smoking', 'unknown')}
        
        Provide a JSON response with:
        - potential_concerns (list)
        - suggested_actions (list)
        - urgency_level (low/medium/high)
        - explanation (brief)
        """
        
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(prompt)
        
        gemini_analysis = parse_gemini_response(response.text)
        
        # Calculate risk score
        risk_score = calculate_risk_score(audio_features, symptoms, patient_data)
        
        # Determine severity
        severity = determine_severity(risk_score, symptoms, gemini_analysis.get('urgency_level'))
        
        # Generate recommendations
        recommendations = generate_recommendations(severity, symptoms, gemini_analysis)
        
        # Predict disease
        disease = predict_disease(audio_features, symptoms, risk_score)
        
        result = {
            'success': True,
            'analysis': {
                'riskScore': risk_score,
                'severity': severity,
                'predictedDisease': disease,
                'recommendations': recommendations,
                'geminiInsights': gemini_analysis,
            },
            'timestamp': datetime.now().isoformat(),
        }
        
        return https_fn.Response(
            json.dumps(result),
            headers={**headers, 'Content-Type': 'application/json'},
            status=200
        )
        
    except Exception as e:
        return https_fn.Response(
            json.dumps({'success': False, 'error': str(e)}),
            headers={**headers, 'Content-Type': 'application/json'},
            status=500
        )

@firestore_fn.on_document_created(document="users/{userId}/health_reports/{reportId}")
def on_health_report_created(event: firestore_fn.Event[firestore_fn.DocumentSnapshot]) -> None:
    """
    Triggered when a new health report is created.
    Performs post-processing and sends notifications if needed.
    """
    try:
        report_data = event.data.to_dict()
        user_id = event.params['userId']
        report_id = event.params['reportId']
        
        severity = report_data.get('severity', 'Low')
        risk_score = report_data.get('riskScore', 0)
        
        # If high risk, flag for review and notify
        if severity in ['High', 'Critical'] or risk_score > 0.7:
            # Update report with flag
            event.data.reference.update({
                'flaggedForReview': True,
                'reviewPriority': 'high' if severity == 'Critical' else 'medium',
            })
            
            # Store alert for potential notification
            db.collection('alerts').add({
                'userId': user_id,
                'reportId': report_id,
                'severity': severity,
                'createdAt': firestore.SERVER_TIMESTAMP,
                'type': 'high_risk_detected',
                'message': f'High risk health report detected: {severity}',
            })
        
        # Update user statistics
        update_user_statistics(user_id)
        
    except Exception as e:
        print(f"Error processing health report: {e}")

@scheduler_fn.on_schedule(schedule="every day 00:00")
def daily_analytics_report(event: scheduler_fn.ScheduledEvent) -> None:
    """
    Daily scheduled function to generate analytics.
    """
    try:
        # Count reports from last 24 hours
        yesterday = datetime.now() - timedelta(days=1)
        
        reports_query = db.collection_group('health_reports').where(
            'createdAt', '>=', yesterday
        ).get()
        
        total_reports = len(reports_query)
        
        high_risk_count = sum(
            1 for r in reports_query 
            if r.to_dict().get('severity') in ['High', 'Critical']
        )
        
        # Store analytics
        db.collection('analytics').add({
            'date': datetime.now().isoformat(),
            'totalReports': total_reports,
            'highRiskCount': high_risk_count,
            'timestamp': firestore.SERVER_TIMESTAMP,
        })
        
        print(f"Daily analytics: {total_reports} reports, {high_risk_count} high risk")
        
    except Exception as e:
        print(f"Error generating analytics: {e}")

@https_fn.on_request()
def get_user_history(req: https_fn.Request) -> https_fn.Response:
    """Get health history for a user."""
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
    }
    
    try:
        user_id = req.args.get('userId')
        if not user_id:
            return https_fn.Response(
                json.dumps({'error': 'userId required'}),
                headers=headers,
                status=400
            )
        
        # Query reports
        reports = db.collection('users').document(user_id).collection('health_reports').order_by(
            'createdAt', direction=firestore.Query.DESCENDING
        ).limit(30).get()
        
        history = []
        for report in reports:
            data = report.to_dict()
            history.append({
                'id': report.id,
                'riskScore': data.get('riskScore'),
                'severity': data.get('severity'),
                'disease': data.get('disease'),
                'createdAt': data.get('createdAt').isoformat() if data.get('createdAt') else None,
            })
        
        return https_fn.Response(
            json.dumps({'success': True, 'history': history}),
            headers=headers,
            status=200
        )
        
    except Exception as e:
        return https_fn.Response(
            json.dumps({'success': False, 'error': str(e)}),
            headers=headers,
            status=500
        )

def parse_gemini_response(text: str) -> dict:
    """Parse Gemini API response into structured format."""
    try:
        # Try to extract JSON
        if '```json' in text:
            json_str = text.split('```json')[1].split('```')[0]
        elif '```' in text:
            json_str = text.split('```')[1].split('```')[0]
        else:
            json_str = text
        
        return json.loads(json_str.strip())
    except:
        # Fallback parsing
        return {
            'potential_concerns': [],
            'suggested_actions': [],
            'urgency_level': 'low',
            'explanation': text[:200] if text else 'No analysis available',
        }

def calculate_risk_score(audio_features, symptoms, patient_data):
    """Calculate composite risk score."""
    lung_score = 0.3  # Placeholder - would use actual model
    symptom_score = min(len(symptoms) * 0.15, 0.6)
    
    age = patient_data.get('age', 30)
    smoking = patient_data.get('smoking', 'never')
    
    risk_factor = 0
    if age > 60:
        risk_factor += 0.2
    elif age > 40:
        risk_factor += 0.1
    
    if smoking == 'current':
        risk_factor += 0.25
    elif smoking == 'former':
        risk_factor += 0.1
    
    return min(lung_score * 0.4 + symptom_score * 0.35 + risk_factor * 0.25, 1.0)

def determine_severity(risk_score, symptoms, urgency_level):
    """Determine severity level."""
    if risk_score > 0.75 or urgency_level == 'high':
        return 'High'
    elif risk_score > 0.45 or urgency_level == 'medium':
        return 'Medium'
    return 'Low'

def generate_recommendations(severity, symptoms, gemini_analysis):
    """Generate personalized recommendations."""
    recs = []
    
    if severity == 'High':
        recs.append('Consult a doctor within 24 hours')
    elif severity == 'Medium':
        recs.append('Schedule a doctor appointment within 3-5 days')
    
    # Add Gemini suggestions
    recs.extend(gemini_analysis.get('suggested_actions', [])[:3])
    
    # Add generic recommendations
    if 'cough' in [s.lower() for s in symptoms]:
        recs.append('Stay hydrated and rest')
    
    return recs[:5]

def predict_disease(audio_features, symptoms, risk_score):
    """Predict disease based on features."""
    if risk_score < 0.25:
        return 'Normal'
    
    # Simple symptom-based prediction
    symptom_str = ' '.join(symptoms).lower()
    
    if 'fever' in symptom_str and 'cough' in symptom_str:
        return 'Pneumonia'
    elif 'wheez' in symptom_str:
        return 'Asthma'
    
    return 'Respiratory Condition'

def update_user_statistics(user_id):
    """Update aggregated statistics for user."""
    try:
        reports = db.collection('users').document(user_id).collection('health_reports').get()
        
        total = len(reports)
        high_risk = sum(1 for r in reports if r.to_dict().get('severity') in ['High', 'Critical'])
        
        db.collection('users').document(user_id).update({
            'statistics': {
                'totalReports': total,
                'highRiskReports': high_risk,
                'lastUpdated': firestore.SERVER_TIMESTAMP,
            }
        })
    except Exception as e:
        print(f"Error updating statistics: {e}")
