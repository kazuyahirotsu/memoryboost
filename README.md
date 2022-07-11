# memoryboost

only English is supported now

### environment setting
```
git clone git@github.com:kazuyahirotsu/memoryboost.git
cd memoryboost
virtualenv .
source bin/activate
pip install -r requirements.txt
```
don't forget to do `npm install` before `npm start`

### additional required files
1. `serviceAccountKey.json`  
generate with firebase console
2. `firebaseConfig.js`


### `video_recognition_all.py`
does all the computing of the video specified and upload the info to firebase


### `deepspeech_local.py`
the script above depends on this script to do speech to text


### `webapp`
webapp to upload images of people and videos and to see the info
