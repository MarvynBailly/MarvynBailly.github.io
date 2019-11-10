from time import sleep
import os

gas = 200
length = "_______________________________________________________________________________________________________________"
car = "     __________ \n    //   |||   \\         \n __//____|||____\\____   \n| _|      |       _  |\n|/ \______|______/ \_| \n_\_/_____________\_/____________________________________________________________________________________ \n"   
#tree = "      /\      \n     /\/\     \n    /\/\/\    \n   /\/\/\/\   \n  /\/\/\/\/\  \n /\/\/\/\/\/\ \n/\/\/\/\/\/\/\ \n      ||      \n      ||      \n      ||      \n"
distance = int(input("How may miles would you like to go?",))
totalDistance = []

def cls():
    os.system('cls' if os.name=='nt' else 'clear')

def drive(distance):
    offset = 100
    for i in range (distance):
        cls()
        print('{}{}{}'.format(car,offset * " ","_____"))
        print(length)
        offset -= 1
        sleep(.2)
        if offset == 0:
            return()

def gasMileage(distance,gas):
    return(distance/gas)

def averageDistance(totalDistance):
    return (sum(totalDistance) / len(totalDistance))

def longestDistance(totaldDistance):
    return(max(totalDistance))

def main(gas,distance):
    drive(distance)
    while True:
        choice = int(input("What would you like to do next (enter corsponding number)?\n 1) Drive again? \n 2) Calculate gas mileage? \n 3) Find average distance? \n 4) Find longest distance? \n 5) quit\n"))
        totalDistance.append(distance)
        if choice == 1:
            distance = int(input("How may miles would you like to go?",))
            drive(distance)
            print("You have driven",distance,"miles!")
            input("Press Enter to continue...")
        elif choice == 2:
            mileage = round(gasMileage(distance,gas),2)
            print("Your mileage is:",mileage,"MPG")
            input("Press Enter to continue...")
        elif choice == 3:
            print("You have driven an average of ",averageDistance(totalDistance)," MPG")
            input("Press Enter to continue...")
        elif choice == 4:
            print("Your longest distance driven is", longestDistance(totalDistance), "Miles")
            input("Press Enter to continue...")
        elif choice == 5:
            break

main(gas,distance)