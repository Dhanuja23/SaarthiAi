import os
from flask import Flask, render_template, request, url_for, redirect
from werkzeug.utils import secure_filename
import librosa as lb
import librosa.display
import matplotlib
#  to avoid flask err of RuntimeError: main thread is not in main loop
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import rdc_model

# Set Gemini API key from environment
os.environ["GEMINI_API_KEY"] = os.environ.get("REACT_APP_GEMINI_API_KEY", "your-gemini-api-key-here")

root_folder = os.path.abspath(os.path.dirname(__file__))
print(root_folder)
UPLOAD_FOLDER_temp = os.path.join(root_folder, "static")
UPLOAD_FOLDER = os.path.join(UPLOAD_FOLDER_temp,"uploads")
print(UPLOAD_FOLDER)
app = Flask(__name__)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/api/classify", methods=["POST"])
def api_classify():
    if "lungSound" not in request.files:
        return {"error": "No audio file provided."}, 400

    name = request.form.get("name", "Patient")
    symptoms = request.form.get("symptoms", "")
    lung_sound = request.files["lungSound"]
    if lung_sound.filename == "":
        return {"error": "No selected file."}, 400

    filename = secure_filename(lung_sound.filename)
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    lung_sound.save(file_path)

    try:
        results = rdc_model.classificationResults(file_path, symptoms)
    except Exception as exc:
        return {"error": str(exc)}, 500

    return {
        "name": name,
        "audioUrl": url_for("static", filename=f"uploads/{filename}"),
        "results": results,
        "waveUrl": url_for("static", filename="uploads/outSoundWave.png"),
        "mfccUrl": url_for("static", filename="uploads/outSoundMFCC.png"),
    }

@app.route("/")
def index():
    dir = UPLOAD_FOLDER
    # empty uploads folder as we do not save sound files of patients
    for f in os.listdir(dir):
        os.remove(os.path.join(dir, f))
    return render_template("index.html",ospf = 1)

@app.route("/", methods = ['POST'])
def patient():
    if request.method == "POST":
        # imp to clear matplotlib cache else it will save the previous figure
        plt.figure().clear()
        
        print(request)
        name = request.form["name"]  # taking data from dictionary
        lungSounds = request.files["lungSounds"]
        print("\n")
        filename = secure_filename(lungSounds.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        # temporarily save sound file of patient in the Uploads folder
        lungSounds.save(file_path)
        audio_url = url_for('static', filename=f'uploads/{filename}')
        absolute_url = os.path.abspath(file_path)

        # pass url of sound file to the model
        res_list = rdc_model.classificationResults(absolute_url)

        # librosa can convert stereo to mono audio
        audio1, sample_rate1 = lb.load(file_path, mono=True)

        plt.figure()
        librosa.display.waveshow(audio1, sr=sample_rate1, max_points=50000, x_axis='time', offset=0)
        wave_path = os.path.join(app.config['UPLOAD_FOLDER'], 'outSoundWave.png')
        plt.savefig(wave_path)
        plt.close()

        plt.figure()
        mfccs = lb.feature.mfcc(y=audio1, sr=sample_rate1, n_mfcc=40)
        fig, ax = plt.subplots()
        img = librosa.display.specshow(mfccs, x_axis='time', ax=ax)
        fig.colorbar(img, ax=ax)
        mfcc_path = os.path.join(app.config['UPLOAD_FOLDER'], 'outSoundMFCC.png')
        plt.savefig(mfcc_path)
        plt.close(fig)

        res_list.append(url_for('static', filename='uploads/outSoundWave.png'))
        res_list.append(url_for('static', filename='uploads/outSoundMFCC.png'))
        print(audio_url)

        lungSounds = audio_url

    return render_template("index.html", ospf=0, n=name, lungSounds=audio_url, res=res_list)

if __name__ == "__main__":
    # changes made for docker
    app.run(host='0.0.0.0', port=5000) 