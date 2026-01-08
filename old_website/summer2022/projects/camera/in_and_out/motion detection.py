import cv2, time, pandas

from datetime import datetime


video = cv2.VideoCapture("rtsp://Mbailly:mbymbymby@10.0.0.202/live")

static_back = None

motion_list = [None, None]

start_time = 0
start_center = 0
center = 0

time_prev = datetime.now()
time_cur = datetime.now()

def addEntry(Start,End,Direction):
    #read data from file 
    data = pandas.read_csv("Time_of_movements.csv",index_col=0)
    data = data.to_dict()
    
    l = len(data["Start"])

    data["Start"][l + 1] = Start
    data["End"][l + 1] = End
    data["Direction"][l + 1] = Direction

    df = pandas.DataFrame(data)
    
    df.to_csv("Time_of_movements.csv", index="False", header="False")

while True:
    check, frame = video.read()
    
    if(check == True):
        motion = 0

        #apply gussian blur
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gauss = cv2.GaussianBlur(gray, (21,21), 0)

        #define static_back on first iteration
        if static_back is None:
            static_back = gauss
            continue
        
        #press r to redefine static_back
        if cv2.waitKey(1) == ord('r'):
            static_back = gauss

        time_cur = datetime.now()
        if(time_cur.hour != time_prev.hour):
            static_back = gauss
            print("Hourly Background Change at", datetime.now())
        time_prev = datetime.now()


        #get difference
        diff_frame = cv2.absdiff(static_back, gauss)

        # If change in between static background and
        # current frame is greater than 30 it will show white color(255)
        thresh_frame = cv2.threshold(diff_frame, 30, 255, cv2.THRESH_BINARY)[1]
        thresh_frame = cv2.dilate(thresh_frame, None, iterations = 2)

        # Finding contour of moving object
        cnts,h = cv2.findContours(thresh_frame.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        #Find largest contour area

        for contour in cnts:
            if cv2.contourArea(contour) < 10000:
                continue
                
            (x, y, w, h) = cv2.boundingRect(contour)
            motion = 1
            record = 0
            if cv2.contourArea(contour) > record:
                record = cv2.contourArea(contour)
                center = x + round(w/2)
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 3)
            cv2.circle(frame, (x + round(w/2),y + round(h/2)), 10, (255,0,0), 3)

        # Appending status of motion
        motion_list.append(motion)
        motion_list = motion_list[-2:]

        # Appending Start time of motion
        if motion_list[-1] == 1 and motion_list[-2] == 0:
            start_time = datetime.now()
            start_center = center

        # Appending End time of motion
        if motion_list[-1] == 0 and motion_list[-2] == 1:
            dir = None
            if start_center - center < -40:
                print("Motion Left at",datetime.now())
                dir = "Left"
            elif start_center - center > 40:
                print("Motion Right at", datetime.now())
                dir = "Right"
            
            if dir != None:
                addEntry(start_time,datetime.now(),dir)

        # Displaying image in gray_scale
        cv2.imshow("Gray Frame", frame)
    
        key = cv2.waitKey(1)
        # if q entered whole process will stop
        if key == ord('q'):
            break


video.release()
cv2.destroyAllWindows()