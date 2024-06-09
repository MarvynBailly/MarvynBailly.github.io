[comment]: <> (Title: Automatic Light Switch)
[comment]: <> (Description: I create an automatic light switch using an ESP8266, a Servo, and some python)
[comment]: <> (Cover image path: cover.PNG)

# Automatic Light Switch

We will use NodeMCU's esp8266, a couple of wires, a power supply, and a mini servo to remotely turn on and off the light switch in my room.

## Setting up the esp8266

To set up the esp8266, begin by downloading the CP2102 driver and the Arduino IDE (it can be done using VSCode but I think this way will be easier). Now plug the board into your computer and open the Arduino IDE. Now to add the board to the IDE, go to File -> Preferences, scroll down and click 'Additional Boards Manager URLs' and enter: 

https://arduino.esp8266.com/stable/package_esp8266com_index.json

Next, go to Tools -> Board -> Boards Manger -> and search esp8266 and download. Now go back to Board and add NodeMCU 1.0. Now the board is connected! To double check, run the following code to make lights blink:

```
#define ledPin1 2 /* LED connected to GPIO 2 */
#define ledPin2 16 /* LED connected to GPIO 16 */

void setup()
{
  pinMode(ledPin1, OUTPUT);
  pinMode(ledPin2, OUTPUT);
}

void loop()
{
  digitalWrite(ledPin1, LOW);
  digitalWrite(ledPin2, HIGH);
  delay(1000);
  digitalWrite(ledPin1, HIGH);
  digitalWrite(ledPin2, LOW);
  delay(1000);
}
```
## Setting up the Servo

Okay, now that the board is set up, let's wire the Servo Mini to it using the following diagram:

```
          +----------------+
          |   NodeMCU      |
          |                |
          |   3.3V/5V -----+----- VCC (Red) Servo
          |   GND ---------+----- GND (Black/Brown) Servo
          |   D5 ----------+----- Signal (Orange/Yellow) Servo
          +----------------+
```

Now to add the servo library, go to Sketch > Include Library > Manage Libraries. Search for "ESP8266Servo" and install it. We can then run the chatgbted test code:

```
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <Servo.h>

Servo myServo;  // create servo object to control a servo

const int servoPin = D5;  // Pin connected to the servo's signal wire

void setup() {
  myServo.attach(servoPin);  // attaches the servo on pin D5 to the servo object
  myServo.write(90);  // set servo to mid-point (90 degrees)
}

void loop() {
  for (int pos = 0; pos <= 180; pos++) {  // goes from 0 degrees to 180 degrees
    myServo.write(pos);  // tell servo to go to position in variable 'pos'
    delay(15);  // waits 15ms for the servo to reach the position
  }
  for (int pos = 180; pos >= 0; pos--) {  // goes from 180 degrees to 0 degrees
    myServo.write(pos);  // tell servo to go to position in variable 'pos'
    delay(15);  // waits 15ms for the servo to reach the position
  }
}
```

## Connecting to WiFi

To connect to wifi, we use the following:

```
const char* ssid = "your_ssid";
const char* password = "your_password"; 

void connectToWifi(){
  WiFi.begin(ssid, password);
  Serial.print("Connecting to ");
  Serial.print(ssid);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}
```

Note, that if your password has special characters backslash or quotation marks, you will need to first backslash.

## HTTP Server

To control the servo remotely, we will use a HTTP server to send HTTPs requests to using a Raspberry Pi.

```
ESP8266WebServer server(80); // listen on port 80


void setup(){
  server.on("/", handleRoot);  // Register the handler function for the root URL
  server.begin();  // Start the HTTP server
  Serial.println("HTTP server started");
}

void loop(){
  server.handleClient();
}
```

## Set up on Raspberry Pi
We can create a simple python script using the library `requests` to send an HTTP request to the server. Note that the port is 80 by default. Running this code on the Pi should move the Servo!

```
import requests

NODEMCU_IP = '192.168.1.100'  # Replace with your NodeMCU IP address

def move_servo(angle):
    try:
        if 0 <= angle <= 180:
            response = requests.get(f'http://{NODEMCU_IP}/?angle={angle}', timeout=20)
            if response.status_code == 200:
                print(f'Servo moved to {angle} degrees')
            else:
                print(f'Error: {response.status_code} - {response.text}')
        else:
            print('Angle out of range (0-180)')
    except requests.exceptions.RequestException as e:
        print(f'HTTP request failed: {e}')

if __name__ == '__main__':
    # Test the servo control
    move_servo(180)
```

## Web Interface
We can now make a simple web interface using python library `flask`.
