# FloatChat Dashboard Implementation Guide

## 🗺️ 3D Ocean Dashboard Overview

Interactive 3D visualization of ARGO float data using Mapbox GL JS, centered on the Indian Ocean with real-time float markers and metadata.

---

## 🔑 Tech Stack

- **Frontend**: Next.js (React 18+)
- **3D Mapping**: Mapbox GL JS (globe projection, 3D terrain)
- **Styling**: Tailwind CSS + shadcn/ui
- **Data Format**: GeoJSON with float coordinates + metadata
- **Deployment**: Vercel

---

## 🚀 Features Implementation

### **Core MVP Features**

- [x] Planning & Architecture
- [ ] 3D Indian Ocean base map (globe projection)
- [ ] Float markers with location data
- [ ] Interactive popups with metadata
- [ ] Responsive design

### **Judge-Wow Features**

- [ ] Temperature/salinity color coding
- [ ] Pulse animations for active floats
- [ ] Smooth animated float entry
- [ ] 3D terrain with ocean depth styling

### **Stretch Features**

- [ ] Historical trajectory lines
- [ ] Heatmap layer toggles
- [ ] Depth-based filtering
- [ ] Real-time data integration

---

## 🏗️ Project Structure

```
src/app/dashboard/
├── page.tsx                 # Main dashboard route
└── components/
    ├── MapContainer.tsx      # 3D Mapbox container
    ├── FloatLayer.tsx        # Float rendering & interactions
    ├── FloatPopup.tsx        # Metadata popup component
    └── MapControls.tsx       # Filters & controls (future)

src/data/
└── mockFloats.json          # Sample ARGO float data (50 floats)

src/lib/
├── mapbox-config.ts         # Mapbox configuration
└── float-utils.ts           # Float data processing utilities
```

---

## ⚙️ Setup Instructions

### **1. Mapbox Configuration**

1. **Get API Key**:

   - Visit [mapbox.com](https://www.mapbox.com)
   - Sign up for free account
   - Go to Account → Access Tokens
   - Copy your default public token (starts with `pk.`)

2. **Environment Variables**:

   ```bash
   # .env.local
   NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_mapbox_token_here
   ```

3. **Free Tier Limits** (perfect for hackathon):
   - 50,000 map loads/month
   - Unlimited for development/demo

### **2. Dependencies Installation**

```bash
# Mapbox GL JS
npm install mapbox-gl
npm install @types/mapbox-gl --save-dev

# Additional utilities
npm install @turf/turf  # Geospatial calculations (optional)
```

### **3. CSS Setup**

Add to `globals.css`:

```css
/* Mapbox GL CSS */
@import "mapbox-gl/dist/mapbox-gl.css";

/* Custom map styles */
.mapbox-container {
  width: 100%;
  height: 100vh;
}
```

---

## 📊 Data Structure

### **Mock GeoJSON Format**

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [75.0, 15.0] // [longitude, latitude]
      },
      "properties": {
        "id": "ARGO_5904567",
        "temperature": 28.5,
        "salinity": 35.2,
        "depth": 1000,
        "lastTransmission": "2024-09-12T10:30:00Z",
        "status": "active",
        "region": "Arabian Sea"
      }
    }
  ]
}
```

### **Float Properties**

- `id`: Unique ARGO float identifier
- `temperature`: Surface temperature (°C)
- `salinity`: Salinity (PSU - Practical Salinity Units)
- `depth`: Current depth (meters)
- `lastTransmission`: ISO timestamp
- `status`: "active" | "inactive" | "maintenance"
- `region`: Geographic region name

---

## 🎨 Visual Design Specs

### **Map Configuration**

- **Center**: Indian Ocean (lat: -10°, lon: 75°)
- **Zoom**: Initial zoom level 4-5
- **Projection**: Globe (3D effect)
- **Tilt**: 20-30° for 3D perspective
- **Bearing**: 0° (north up)

### **Color Coding**

```typescript
// Temperature-based colors
const getTemperatureColor = (temp: number) => {
  if (temp < 15) return "#2563eb"; // Cold - Blue
  if (temp < 25) return "#16a34a"; // Moderate - Green
  if (temp < 30) return "#eab308"; // Warm - Yellow
  return "#dc2626"; // Hot - Red
};

// Salinity-based opacity
const getSalinityOpacity = (salinity: number) => {
  return Math.min(salinity / 40, 1); // Higher salinity = more opaque
};
```

### **Marker Styling**

- **Size**: 8-12px radius
- **Glow**: 2px shadow for active floats
- **Pulse**: 1.5s animation cycle
- **Hover**: Scale to 1.2x size

---

## 🎯 Implementation Phases

### **Phase 1: Foundation (Day 1)**

1. ✅ Project setup & dependencies
2. ⏳ Basic `/dashboard` route
3. ⏳ Mapbox integration & 3D map
4. ⏳ Mock data creation (50 floats)
5. ⏳ Basic float markers

### **Phase 2: Interactivity (Day 2)**

1. ⏳ Click/hover popups
2. ⏳ Temperature color coding
3. ⏳ Responsive design
4. ⏳ Error handling

### **Phase 3: Polish (Day 3)**

1. ⏳ Pulse animations
2. ⏳ Smooth entry animations
3. ⏳ Performance optimization
4. ⏳ Demo preparation

---

## 🧪 Testing Strategy

### **Manual Testing Checklist**

- [ ] Map loads without errors
- [ ] All 50 floats render correctly
- [ ] Popups show correct metadata
- [ ] Colors match temperature values
- [ ] Animations run smoothly (60fps)
- [ ] Mobile responsiveness
- [ ] Different screen sizes

### **Demo Scenarios**

1. **Wide View**: Show entire Indian Ocean with all floats
2. **Zoom In**: Focus on Arabian Sea region
3. **Interaction**: Click multiple floats to show popups
4. **Performance**: Smooth navigation/rotation

---

## 🚀 Performance Optimization

### **Rendering Strategy**

- Use Mapbox's built-in clustering for >100 floats
- Implement level-of-detail (LOD) for zoom levels
- Debounce hover/click events
- Lazy load popup content

### **Data Optimization**

- Compress GeoJSON (remove unnecessary precision)
- Cache float data in localStorage
- Implement virtual scrolling for large datasets

---

## 🎪 Judge Demo Script

### **Opening (30 seconds)**

"This is our 3D Ocean Intelligence Dashboard. Watch as we explore real ARGO float data across the Indian Ocean..."

### **Key Demo Points**

1. **3D Navigation**: "Smooth globe interaction with tilt and rotation"
2. **Data Density**: "50 active floats monitoring ocean conditions"
3. **Rich Information**: "Each float shows temperature, salinity, and status"
4. **Regional Focus**: "Zoom into Arabian Sea and Bay of Bengal"
5. **Visual Coding**: "Colors represent temperature gradients"

### **Wow Moments**

- Pulse animations on active floats
- Smooth 3D map transitions
- Rich popup information
- Professional visual design

---

## 🔧 Troubleshooting

### **Common Issues**

1. **Mapbox Token**: Ensure token is in `.env.local` and starts with `pk.`
2. **CORS Errors**: Use Next.js API routes for data fetching
3. **Performance**: Reduce float count or simplify animations
4. **Mobile**: Test on smaller screens, adjust marker sizes

### **Fallback Plan**

- Static map image if Mapbox fails
- Simplified markers if animations lag
- Pre-recorded demo video as backup

---

## 📋 Next Steps

After dashboard completion:

1. **Landing Page**: Add "View Dashboard" button
2. **Data Integration**: Connect to real ARGO NetCDF data
3. **Chatbot Integration**: Context sharing between components
4. **Advanced Features**: Filters, animations, real-time updates

---

_Dashboard Implementation Status: Ready to Build_ 🚀
