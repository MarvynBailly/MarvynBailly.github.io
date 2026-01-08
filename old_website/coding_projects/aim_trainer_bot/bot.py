from pyautogui import *
import pyautogui
import time
import keyboard
import random
import win32api, win32con

def click(x,y):
    win32api.SetCursorPos((x,y))
    win32api.mouse_event(win32con.MOUSEEVENTF_LEFTDOWN,0,0)
    win32api.mouse_event(win32con.MOUSEEVENTF_LEFTUP,0,0)

prevX = 0
prevY = 0

while keyboard.is_pressed('q') == False:
    pic = pyautogui.screenshot(region=(498,374,900,600))
    
    width, height = pic.size
    
    for x in range(0,width,10):
        for y in range(0,height,10):
            
            r,g,b = pic.getpixel((x,y))
            
            if r == 255 and g == 219 and b == 195 and prevX != x and prevY != y:
                click(x+498,y+374)
                sleep(0.09)
                prevX = x
                prevY = y
                break