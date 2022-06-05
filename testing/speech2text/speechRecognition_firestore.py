import speech_recognition as sr
import datetime
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

cred = credentials.Certificate("../memoryboost-79ad5-firebase-adminsdk-b47qp-1f3ed9644c.json")
firebase_admin.initialize_app(cred)
db = firestore.client()
doc_ref = db.collection(u'users').document(u'kazuya').collection(u'words')

# obtain audio from the microphone
r = sr.Recognizer()

while True:
    now = datetime.datetime.now()
    with sr.Microphone() as source:
        r.adjust_for_ambient_noise(source)
        print("Say something!")
        audio = r.listen(source)
    try:
        # for testing purposes, we're just using the default API key
        # to use another API key, use `r.recognize_google(audio, key="GOOGLE_SPEECH_RECOGNITION_API_KEY")`
        # instead of `r.recognize_google(audio)`
        res = r.recognize_google(audio, language='ja-JP')
        print("Google Speech Recognition thinks you said " + res)
        #u'' is for unicode
        doc_ref.add({
            u'words': res,
            u'time': now,
        })
    except sr.UnknownValueError:
        print("Google Speech Recognition could not understand audio")
    except sr.RequestError as e:
        print("Could not request results from Google Speech Recognition service; {0}".format(e))