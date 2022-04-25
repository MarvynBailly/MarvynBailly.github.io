import pyautogui
import keyboard
#top left: X:  347 Y:  228
#bottom right: X: 1546 Y:  952

while True:
    if keyboard.is_pressed('s') == True:
        iml = pyautogui.screenshot(region=(498,374,900,600))
        iml.save(r"C:\Users\admin\Desktop\Code Bro\websites\MarvynBailly.github.io - Copy\coding_projects\aim_trainer_bot\savedimage.png")
        break