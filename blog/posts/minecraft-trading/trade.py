import pyautogui
import time
import keyboard
import cv2
import numpy as np


def on_key_release(event):
    if event.name == "p":
        current_mouse_position = pyautogui.position()
        print(f"Current mouse position: {current_mouse_position}")
    

    
    if event.name == "r":
        # load images
        screenshot = pyautogui.screenshot()
        inventory_img = cv2.cvtColor(np.array(screenshot), cv2.COLOR_RGB2BGR)
        inventory_img_gray = cv2.cvtColor(inventory_img, cv2.COLOR_BGR2GRAY)
        
        string_img = cv2.imread("./images/string.PNG", cv2.IMREAD_UNCHANGED)
        string_img_gray = cv2.cvtColor(string_img, cv2.COLOR_BGR2GRAY)

        result = cv2.matchTemplate(inventory_img_gray, string_img_gray, cv2.TM_CCOEFF_NORMED)
        threshold = 0.8
        yloc, xloc = np.where( result >= threshold)
        xloc_shifted = [x + 20 for x in xloc]
        yloc_shifted = [y + 20 for y in yloc]

        for (x_pos, y_pos) in zip(xloc_shifted, yloc_shifted):
            #move to the string
            pyautogui.moveTo(x=x_pos, y=y_pos)
            pyautogui.click()
            
            #move to the trade slot
            pyautogui.moveTo(x=990, y=390)
            pyautogui.click()
            
            #get emeralds
            pyautogui.keyDown("shift")
            pyautogui.moveTo(x=1320, y=400) 
            pyautogui.click()
            
            #put string back
            pyautogui.moveTo(x=990, y=390)
            pyautogui.click()
                
            pyautogui.keyUp("shift")
            
            #check to see if the villager is maxed
            screenshot = pyautogui.screenshot()
            inventory_img = cv2.cvtColor(np.array(screenshot), cv2.COLOR_RGB2BGR)
            inventory_img_gray = cv2.cvtColor(inventory_img, cv2.COLOR_BGR2GRAY)
            maxed_img = cv2.imread("./images/finished.PNG", cv2.IMREAD_UNCHANGED)
            maxed_img_gray = cv2.cvtColor(maxed_img, cv2.COLOR_BGR2GRAY)
            result = cv2.matchTemplate(inventory_img_gray, maxed_img_gray, cv2.TM_CCOEFF_NORMED)
            threshold = 0.9
            xloc, yloc = np.where( result >= threshold)
            if(len(xloc) > 0):
                print("Villager is maxed")
                break



        
        
        
        
        

def main():
    print("In main loop")

    # Add event listener for key releases
    keyboard.on_release(on_key_release)
    
    while True:
        if keyboard.is_pressed('q'):
            print("exiting")
            break
    
    
    
if __name__ == "__main__":
    main()
