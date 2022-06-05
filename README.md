# memoryboost

```
git clone git@github.com:kazuyahirotsu/memoryboost.git
cd memoryboost
virtualenv .
source bin/activate
pip install -r requirements.txt
```

### `video_recognition_firestore.py`
1. learn faces from images folder 
2. recognize known and unknown face each other frame
3. record it on firestore each minute  

todo: get images from firebase, upload video to firebase


### `speechRecognition_firestore.py`
1. recognize speech in jp
2. record the timestamp of each recognized words on firestore
