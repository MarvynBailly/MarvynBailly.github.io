#include <ESP8266WiFi.h>

const char* ssid = "The White House";  // replace with your network SSID
const char* password = "0\\{S!),zEdo-#*tThz!Z";  // replace with your network password

WiFiClient client;

void connectToWiFi() {
//Connect to WiFi Network
   Serial.println();
   Serial.println();
   Serial.print("Connecting to WiFi");
   Serial.println("...");
   WiFi.begin(ssid, password);
   int retries = 0;
while ((WiFi.status() != WL_CONNECTED) && (retries < 15)) {
   retries++;
   delay(500);
   Serial.print(".");
}
if (retries > 14) {
    Serial.println(F("WiFi connection FAILED"));
}
if (WiFi.status() == WL_CONNECTED) {
    Serial.println(F("WiFi connected!"));
    Serial.println("IP address: ");
    Serial.println(WiFi.localIP());
}
    Serial.println(F("Setup ready"));
}

void setup() {
  Serial.begin(115200);
  delay(10);

  connectToWiFi();
}

void loop() {

}

