import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import io from "socket.io-client";

const SOCKET_SERVER_URL = "process.env.REACT_APP_BASE_URL"; // Update this if your server runs on a different host or port

// Define the custom marker icon
const customIcon = L.icon({
  iconUrl: "/assets/location-pin.png", // Replace with the path to your custom icon
  iconSize: [38, 38], // Size of the icon
  iconAnchor: [19, 38], // Anchor point of the icon (base of the pin)
  popupAnchor: [0, -38], // Point from which the popup should open relative to the iconAnchor
});

const Map = () => {
  const mapRef = useRef(null);
  const [markers, setMarkers] = useState({});
  const socket = useRef(null);

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map("map").setView([0, 0], 16);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "LiveLoop",
      }).addTo(mapRef.current);
    }

    socket.current = io(SOCKET_SERVER_URL);

    socket.current.on("connect", () => {
      console.log("Connected to socket server:", socket.current.id);
    });

    socket.current.on("connect_error", (err) => {
      console.error("Connection error:", err);
    });

    socket.current.on("receive-location", (data) => {
      const { id, latitude, longitude } = data;
      console.log("Received location:", data);

      mapRef.current.setView([latitude, longitude]);

      setMarkers((prevMarkers) => {
        if (prevMarkers[id]) {
          prevMarkers[id].setLatLng([latitude, longitude]);
        } else {
          prevMarkers[id] = L.marker([latitude, longitude], {
            icon: customIcon,
          }).addTo(mapRef.current);
        }
        return { ...prevMarkers };
      });
    });

    socket.current.on("user-disconnected", (id) => {
      setMarkers((prevMarkers) => {
        if (prevMarkers[id]) {
          mapRef.current.removeLayer(prevMarkers[id]);
          delete prevMarkers[id];
        }
        return { ...prevMarkers };
      });
    });

    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          socket.current.emit("send-location", { latitude, longitude });
          console.log("Sending location:", position.coords);
        },
        (error) => console.error("Error getting geolocation:", error),
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return <div id="map" style={{ height: "100vh" }} />;
};

export default Map;
