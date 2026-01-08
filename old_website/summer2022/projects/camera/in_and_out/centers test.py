center = (1,2)
centers_prev = (0,1)


#figure out direction of motion
if len(center) > len(centers_prev):
    centers_prev = center


for i in range(len(center)):
    if(center[0] - centers_prev[0] > 20):
        print("Motion to the left")
    elif(center[0] - centers_prev[0] < -20):
        print("Motion to the right")