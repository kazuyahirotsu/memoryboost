import face_recognition
import cv2
import numpy as np
import os
import datetime
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from firebase_admin import storage


class VideoRecognition:
    def __init__(self, videocapture, compress_factor, username):
        # firebase
        self.username = username
        self.cred = credentials.Certificate("../serviceAccountKey.json")
        firebase_admin.initialize_app(self.cred, {
            'storageBucket': 'memoryboost-79ad5.appspot.com'
        })
        self.bucket = storage.bucket()
        self.db = firestore.client()
        self.user_ref = self.db.collection(u'users').document(self.username)
        self.faces_ref = self.db.collection(u'users').document(self.username).collection(u'faces')

        # video
        self.video_capture = cv2.VideoCapture(videocapture)
        self.compress_factor = compress_factor
        self.video_capture.set(cv2.CAP_PROP_FRAME_WIDTH,1920)
        self.video_capture.set(cv2.CAP_PROP_FRAME_HEIGHT,1080)
        self.video_capture.set(cv2.CAP_PROP_FPS,20)
        self.width = int(self.video_capture.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.height = int(self.video_capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
        self.fps = int(self.video_capture.get(cv2.CAP_PROP_FPS))

        # recording
        self.fourcc = cv2.VideoWriter_fourcc(*'XVID')
        self.out = cv2.VideoWriter('output.avi', self.fourcc, self.fps, (self.width,  self.height))
    
    def get_face_master(self):
        # get previously found faces from firestore
        faces_master_got = self.user_ref.get()
        print(faces_master_got)
        if faces_master_got.exists:
            self.faces_master = faces_master_got.to_dict()
            print(f'Document data: {faces_master_got.to_dict()}')
        else:
            print(u'faces_master not found, Adding empty lists to firestore')
            self.faces_master = {
                u'faces_master':[]
            }
            self.user_ref.set(self.faces_master)

    def load_faces(self):
        self.known_face_encodings = []
        self.known_face_names = []
        # get list of face_images from storage and download ones not found locally
        face_images_storage = [i.name[len(self.username+"/face_images")+1:] for i in self.bucket.list_blobs(prefix=self.username+"/face_images")]
        face_images_local = [i for i in os.listdir("images")]
        face_images_diff = list(set(face_images_storage) ^ set(face_images_local))
        for image in face_images_diff:
            if image != "":
                print(self.username+"/face_images/"+image)
                print("images/"+image)
                self.download_blob(self.username+"/face_images/"+image,"images/"+image)

        # learn faces
        for image in os.listdir("images"):
            name = image.split(".")[0]
            print(name)
            try:
                exec('{}_image = face_recognition.load_image_file("images/{}")'.format(name, image))
                exec('{}_face_encoding = face_recognition.face_encodings({}_image)[0]'.format(name, name))
                exec('self.known_face_encodings.append({}_face_encoding)'.format(name))
                self.known_face_names.append(name)
            except Exception as e:
                print(name, e)
                print("probably face not found")
                continue
        print("loaded these faces: ", self.known_face_names)

    def process(self):
        face_locations = []
        face_encodings = []
        face_names = []
        face_names_firestore = set()
        process_this_frame = True
        now = datetime.datetime.now()
        frame_count = 0
        while True:
            frame_count += 1

            # send found faces info to firestore every minute
            before_time = now
            before_minute = now.minute
            now = datetime.datetime.now()
            now_minute = now.minute
            if now_minute != before_minute:
                self.faces_ref.add({
                    u'faces': face_names_firestore,
                    u'time': before_time,
                })
                for face_name in face_names_firestore:
                    if not face_name in self.faces_master["faces_master"]:
                        self.faces_master["faces_master"].append(face_name)
                        self.user_ref.set(self.faces_master)
                        print("adding {} to faces_master".format(face_name))

            # Grab a single frame of video
            ret, frame = self.video_capture.read()

            original_frame = frame.copy()

            self.out.write(original_frame)

            # Resize frame of video to 1/compress_factor size for faster face recognition processing
            small_frame = cv2.resize(frame, (0, 0), fx=1/self.compress_factor, fy=1/self.compress_factor)
            
            # Convert the image from BGR color (which OpenCV uses) to RGB color (which face_recognition uses)
            rgb_small_frame = small_frame[:, :, ::-1]

            # Only process 1/20 frame of video to save time
            if frame_count%20 == 0:
                # Find all the faces and face encodings in the current frame of video
                face_locations = face_recognition.face_locations(rgb_small_frame)
                face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)

                face_names = []
                for face_encoding in face_encodings:
                    # See if the face is a match for the known face(s)
                    matches = face_recognition.compare_faces(self.known_face_encodings, face_encoding)
                    name = "Unknown"

                    # # If a match was found in known_face_encodings, just use the first one.
                    # if True in matches:
                    #     first_match_index = matches.index(True)
                    #     name = known_face_names[first_match_index]

                    # Or instead, use the known face with the smallest distance to the new face
                    face_distances = face_recognition.face_distance(self.known_face_encodings, face_encoding)
                    best_match_index = np.argmin(face_distances)
                    if matches[best_match_index]:
                        name = self.known_face_names[best_match_index]

                    face_names.append(name)

            # firestore
            # print(face_names)
            for face_name in face_names:
                face_names_firestore.add(face_name)

            # Display the results
            for (top, right, bottom, left), name in zip(face_locations, face_names):
                # Scale back up face locations since the frame we detected in was scaled to 1/4 size
                top *= self.compress_factor
                right *= self.compress_factor
                bottom *= self.compress_factor
                left *= self.compress_factor

                # Draw a box around the face
                cv2.rectangle(frame, (left, top), (right, bottom), (0, 0, 255), 2)

                # Draw a label with a name below the face
                cv2.rectangle(frame, (left, bottom - 35), (right, bottom), (0, 0, 255), cv2.FILLED)
                font = cv2.FONT_HERSHEY_DUPLEX
                cv2.putText(frame, name, (left + 6, bottom - 6), font, 1.0, (255, 255, 255), 1)

            # Display the resulting image
            cv2.imshow('Video', frame)

            key = cv2.waitKey(1) & 0xFF

            # Hit 'q' on the keyboard to quit!, 's' to save a new face image
            if key == ord('s'):
                self.learn_new_face(original_frame)
            elif key == ord('q'):
                break
    
    def stop(self):
        # Release handle to the webcam
        self.video_capture.release()
        cv2.destroyAllWindows()

    def learn_new_face(self, img):
        cv2.imshow('learning new face', img)
        cv2.waitKey(1)
        print("who is this (type q to abort): ")
        name = input()
        if name == "q":
            cv2.destroyWindow('learning new face')
            print("learning new face aborted")
        else:
            cv2.imwrite("images/{}.jpg".format(name), img)
            self.upload_blob("images/"+name+".jpg", self.username+"/face_images/"+name+".jpg")
            cv2.destroyWindow('learning new face')
            self.load_faces()

    def download_blob(self, source_blob_name, destination_file_name):
        blob = self.bucket.blob(source_blob_name)
        blob.download_to_filename(destination_file_name)

        print(
            "Downloaded storage object {} to local file {}.".format(
                source_blob_name, destination_file_name
            )
        )
    def upload_blob(self, source_file_name, destination_blob_name):

        blob = self.bucket.blob(destination_blob_name)
        blob.upload_from_filename(source_file_name)

        print(
            f"File {source_file_name} uploaded to {destination_blob_name}."
        )
    
    

def main():
    videoRecognition = VideoRecognition(0, 4, "kazuya")
    videoRecognition.get_face_master()
    videoRecognition.load_faces()
    videoRecognition.process()
    videoRecognition.stop()

if __name__ == "__main__":
    main()
