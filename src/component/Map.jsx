// src/components/Map.js
import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import io from "socket.io-client";

const Map = () => {
  const mapRef = useRef(null);
  const [markers, setMarkers] = useState({});
  const socket = useRef(null);

  useEffect(() => {
    // Initialize the map only if it hasn't been initialized yet
    if (!mapRef.current) {
      mapRef.current = L.map("map").setView([0, 0], 16);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "LiveLoop",
      }).addTo(mapRef.current);
    }

    // Initialize socket.io
    socket.current = io();

    // Listen for location updates
    socket.current.on("receive-location", (data) => {
      const { id, latitude, longitude } = data;
      mapRef.current.setView([latitude, longitude]);

      // Update or create marker for each location
      setMarkers((prevMarkers) => {
        if (prevMarkers[id]) {
          prevMarkers[id].setLatLng([latitude, longitude]);
        } else {
          prevMarkers[id] = L.marker([latitude, longitude]).addTo(
            mapRef.current
          );
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

    // Send location periodically
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          socket.current.emit("send-location", { latitude, longitude });
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

    // Cleanup on component unmount
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
