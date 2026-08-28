# Home Network & WiFi Infrastructure

> [!NOTE]
> **Router**: UniFi Dream Machine Pro (UDM-Pro)  
> **Switch**: UniFi USW-24-PoE  
> **Access Points**: 2x UniFi U6-Pro (Main Floor & Upstairs)

---

## 📶 Wireless SSIDs

| Network Name (SSID) | Band | VLAN | Purpose |
| :--- | :--- | :--- | :--- |
| `Parma-Home` | 5GHz / 6GHz | Default (1) | Personal laptops, phones, tablets |
| `Parma-IoT` | 2.4GHz only | 20 (Isolated) | Smart plugs, thermostats, appliances |
| `Parma-Guest` | 2.4GHz / 5GHz | 30 (Client Isolate) | Friends and visitors (no local subnet access) |

---

## 🖥️ Static Homelab IP Allocations

- `192.168.1.1` - UDM-Pro Gateway / Router
- `192.168.1.5` - Synology NAS (NFS & Time Machine Backups)
- `192.168.1.10` - Homelab Mini PC (Parma Wiki & Docker host)
- `192.168.1.53` - [[appliances/HVAC & Heat Pump|Ecobee Smart Thermostat]]
- `192.168.1.62` - [[appliances/Espresso Machine|Coffee Station IoT Smart Plug]]

> [!TIP]
> Pi-hole / AdGuard Home DNS is configured at `192.168.1.2` for whole-network tracking and ad blocking.

---

## 🔗 Related Notes
- [[household/Emergency Contacts|ISP Tech Support & Outages]]
- [[Home|Home Wiki Dashboard]]
