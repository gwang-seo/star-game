/*
  StickS3 -> Star Game battery MQTT (no academy PC software)
  Arduino libraries: M5Unified, M5PM1, PubSubClient
  Wi-Fi and battery only; A first press sends retained MQTT battery percentage;
  A second press or 60s without a second press shuts down.
  Public broker = demo only: message can be seen/spoofed by others.
*/
#include <M5Unified.h>
#include <M5PM1.h>
#include <Wire.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <esp_sleep.h>

// Only the first Wi-Fi network. Fill password locally, not in public GitHub.
const char* WIFI_SSID = "KT_GiGA_2G_Wave2_9858";
const char* WIFI_PASS = "WIFI_PASSWORD";
const char* MQTT_HOST = "broker.emqx.io";
const uint16_t MQTT_PORT = 1883;
const char* MQTT_TOPIC = "drscience/sticks3/battery/7c5e20f0d4a849ab";
const unsigned long AUTO_OFF_MS = 60000UL;

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);
M5PM1 pm1;
bool pmReady = false;
bool firstPressed = false;
unsigned long bootMs = 0;

void show(const String& line) {
  M5.Display.fillScreen(BLACK);
  M5.Display.setTextColor(WHITE, BLACK);
  M5.Display.setTextSize(2);
  M5.Display.setCursor(5, 35);
  M5.Display.println(line);
}
void powerOff() {
  show("POWER OFF");
  delay(250);
  if (mqttClient.connected()) mqttClient.disconnect();
  WiFi.disconnect(true);
  WiFi.mode(WIFI_OFF);
  M5.Display.setBrightness(0);
  if (pmReady) pm1.shutdown();
  // Fallback: deep sleep without wake timer (not physical power disconnect)
  esp_sleep_disable_wakeup_source(ESP_SLEEP_WAKEUP_ALL);
  esp_deep_sleep_start();
}
bool connectWiFi() {
  show("WiFi...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  unsigned long started = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - started < 10000UL) {
    delay(50);
  }
  return WiFi.status() == WL_CONNECTED;
}
void sendBattery() {
  if (!connectWiFi()) {
    show("WIFI FAIL");
    delay(900);
    return;
  }
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  String clientId = "sticks3_" + String((uint32_t)ESP.getEfuseMac(), HEX);
  if (!mqttClient.connect(clientId.c_str())) {
    show("MQTT FAIL");
    WiFi.disconnect(true);
    WiFi.mode(WIFI_OFF);
    delay(900);
    return;
  }
  int battery = M5.Power.getBatteryLevel();
  if (battery < 0) battery = 0;
  if (battery > 100) battery = 100;
  String payload = "{\"battery\":" + String(battery) + "}";
  bool ok = mqttClient.publish(MQTT_TOPIC, payload.c_str(), true);
  mqttClient.loop();
  delay(400);
  mqttClient.disconnect();
  WiFi.disconnect(true);
  WiFi.mode(WIFI_OFF);
  if (ok) {
    firstPressed = true;
    show("SENT " + String(battery) + "%\nA: OFF");
  } else {
    show("SEND FAIL");
  }
}
void setup() {
  auto cfg = M5.config();
  M5.begin(cfg);
  pinMode(38, OUTPUT); // existing successful StickS3 code
  digitalWrite(38, HIGH);
  M5.Display.setRotation(1);
  M5.Display.setBrightness(255);
  Serial.begin(115200);
  auto sda = M5.getPin(m5::pin_name_t::in_i2c_sda);
  auto scl = M5.getPin(m5::pin_name_t::in_i2c_scl);
  Wire.end();
  Wire.begin(sda, scl, 100000U);
  pmReady = pm1.begin(&Wire, M5PM1_DEFAULT_ADDR,
                      sda, scl, M5PM1_I2C_FREQ_100K) == M5PM1_OK;
  bootMs = millis();
  show("A: SEND\nAUTO OFF 60s");
}
void loop() {
  M5.update();
  if (millis() - bootMs >= AUTO_OFF_MS) powerOff();
  if (M5.BtnA.wasPressed()) {
    if (firstPressed) powerOff();
    else sendBattery();
  }
  delay(30);
}
