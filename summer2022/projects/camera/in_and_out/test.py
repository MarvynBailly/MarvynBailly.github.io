import cv2, time, pandas
# importing datetime class from datetime library
from datetime import datetime


video = cv2.VideoCapture("rtsp://Mbailly:mbymbymby@10.0.0.202/live")

static_back = None

motion_list = [None, None]

time = []
direction = []

#df = pandas.DataFrame(columns = ["Start", "End", "Direction"])

start_time = 0
start_center = 0
center = 0

time_prev = datetime.now()
time_cur = datetime.now()

# center_prev = ()
# onScreen = False
# right_weight = 0
# left_weight = 0

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

        #draw rect and point at center of moving object


        
        #figure out direction of motion
        #If the object is on screen, start weighing left and right
        # if onScreen == False:
        #     if right_weight > 0:
        #         print("Motion to the Right")
        #     if left_weight > 0:
        #         print("Motion to the Left")
                
        #     right_weight = 0
        #     left_weight = 0

        # if len(center) > len(center_prev):
        #     center_prev = center

        

        # if len(center) == 2:
        #     if(center[0] - center_prev[0] > 20):
        #         left_weight += 1
        #     elif(center[0] - center_prev[0] < -20):
        #         right_weight += 1
            

        # center_prev = center

        # Appending status of motion
        motion_list.append(motion)
        motion_list = motion_list[-2:]

        # Appending Start time of motion
        if motion_list[-1] == 1 and motion_list[-2] == 0:
            #time.append(datetime.now())
            start_time = datetime.now()
            start_center = center
            #print(start_center)
            #onScreen = True

        # Appending End time of motion
        if motion_list[-1] == 0 and motion_list[-2] == 1:
            #time.append(datetime.now())
            #print(center)
            #print(start_center - center)
            dir = None
            if start_center - center < -40:
                print("Motion Left at",datetime.now())
                dir = "Left"
            elif start_center - center > 40:
                print("Motion Right at", datetime.now())
                dir = "Right"
            
            if dir != None:
                addEntry(start_time,datetime.now(),dir)
                #time.append(start_time)
                #time.append(datetime.now())
                #direction.append(dir)
                #direction.append(dir)
            #onScreen = False 

        # Displaying image in gray_scale
        cv2.imshow("Gray Frame", frame)
    
        # Displaying the difference in currentframe to
        # the staticframe(very first_frame)
        #qcv2.imshow("Difference Frame", diff_frame)
    
        # Displaying the black and white image in which if
        # intensity difference greater than 30 it will appear white
        #cv2.imshow("Threshold Frame", thresh_frame)
    
        key = cv2.waitKey(1)
        # if q entered whole process will stop
        if key == ord('q'):
            # if something is moving then it append the end time of movement
            if motion == 1:
                time.append(datetime.now())
            break



    

# Appending time of motion in DataFrame
#for i in range(0, len(time), 2):
    #df = df.concat({"Start":time[i], "End":time[i + 1], "Direction":direction[i]}, ignore_index = True)
    
  
# Creating a CSV file in which time of movements will be saved
#df.to_csv("Time_of_movements.csv", mode="a", index="False", header="False")

video.release()
cv2.destroyAllWindows()