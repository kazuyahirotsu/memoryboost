import cv2

faceCascade = cv2.CascadeClassifier("haarcascade_frontalface_default.xml")

#img = cv2.imread("images/linus.jpg")

vc = cv2.VideoCapture("../videos/linus_moving.mp4")

while True:
    _, img = vc.read()

    gray_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    faces = faceCascade.detectMultiScale(gray_img, scaleFactor = 1.2, minNeighbors = 5, minSize = (70, 70))

    for (x, y, w, h) in faces:
        cv2.rectangle(img, (x, y), (x+w, y+h), (0, 255, 0), 2)

    cv2.imshow("identified faces", img)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break 

vc.release()
cv2.destroyAllWindows()