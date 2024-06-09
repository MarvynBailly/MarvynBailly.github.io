#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <Servo.h>

const char* ssid = "The White House";  // replace with your network SSID
const char* password = "0\\{S!),zEdo-#*tThz!Z";  // replace with your network password

ESP8266WebServer server(80);

Servo myServo;  // create servo object to control a servo

const int servoPin = D5;  // Pin connected to the servo's signal wire

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

void handleRoot() {
  Serial.println("Received request at root");
  if (server.hasArg("angle")) {
    String angleString = server.arg("angle");
    int angle = angleString.toInt();
    if (angle >= 0 && angle <= 180) {
      myServo.write(angle);
      server.send(200, "text/plain", "Servo moved to " + angleString + " degrees");
    } else {
      server.send(400, "text/plain", "Angle out of range (0-180)");
    }
  } else {
    server.send(400, "text/plain", "Angle parameter missing");
  }
}

void setup() {
  Serial.begin(115200);
  myServo.attach(servoPin);
  myServo.write(90);  

  connectToWifi();

  server.on("/", handleRoot);

  server.begin();
  Serial.println("HTTP server started");
}

void loop() {
  // for (int pos = 0; pos <= 180; pos++) {  // goes from 0 degrees to 180 degrees
  //   myServo.write(pos);  // tell servo to go to position in variable 'pos'
  //   delay(15);  // waits 15ms for the servo to reach the position
  // }
  // for (int pos = 180; pos >= 0; pos--) {  // goes from 180 degrees to 0 degrees
  //   myServo.write(pos);  // tell servo to go to position in variable 'pos'
  //   delay(15);  // waits 15ms for the servo to reach the position
  // }
  server.handleClient();

}
