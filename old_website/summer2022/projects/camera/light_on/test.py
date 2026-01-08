import cv2
import mediapipe as mp
import requests
from datetime import datetime

mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles
mp_hands = mp.solutions.hands

webhook_url = "https://maker.ifttt.com/trigger/trigger1/json/with/key/dbY9QlkRfNGnYF7riu1uW7"

activation_time = datetime.now().minute - 1

# For webcam input:
cap = cv2.VideoCapture("rtsp://Mbailly:mbymbymby@10.0.0.202/live")

with mp_hands.Hands(
    model_complexity=0,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5) as hands:
  while cap.isOpened():
    success, image = cap.read()
    if not success:
      #print("Ignoring empty camera frame.")
      # If loading a video, use 'break' instead of 'continue'.
      continue

    # To improve performance, optionally mark the image as not writeable to
    # pass by reference.
    image.flags.writeable = False
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = hands.process(image)

    # Draw the hand annotations on the image.
    image.flags.writeable = True
    image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    if results.multi_hand_landmarks:
      for hand_landmarks in results.multi_hand_landmarks:
        mp_drawing.draw_landmarks(
            image,
            hand_landmarks,
            mp_hands.HAND_CONNECTIONS,
            mp_drawing_styles.get_default_hand_landmarks_style(),
            mp_drawing_styles.get_default_hand_connections_style())
    # Flip the image horizontally for a selfie-view display.
    
    #Detect when you give an L
    if results.multi_hand_landmarks:
        if (results.multi_hand_landmarks[0].landmark[mp_hands.HandLandmark.INDEX_FINGER_TIP].y < results.multi_hand_landmarks[0].landmark[mp_hands.HandLandmark.INDEX_FINGER_MCP].y and
            results.multi_hand_landmarks[0].landmark[mp_hands.HandLandmark.MIDDLE_FINGER_TIP].y > results.multi_hand_landmarks[0].landmark[mp_hands.HandLandmark.MIDDLE_FINGER_MCP].y and 
            results.multi_hand_landmarks[0].landmark[mp_hands.HandLandmark.RING_FINGER_TIP].y > results.multi_hand_landmarks[0].landmark[mp_hands.HandLandmark.RING_FINGER_MCP].y and
            results.multi_hand_landmarks[0].landmark[mp_hands.HandLandmark.PINKY_TIP].y < results.multi_hand_landmarks[0].landmark[mp_hands.HandLandmark.PINKY_MCP].y and
            activation_time != datetime.now().minute):
                print("Triggered!")
                r = requests.post(webhook_url)
                activation_time = datetime.now().minute


    cv2.imshow('MediaPipe Hands', cv2.flip(image, 1))
    key = cv2.waitKey(1)
    if key == ord('q'):
      break


cap.release()