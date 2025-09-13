// Utility to format float IDs for better display
export const formatFloatId = (fullId: string): string => {
  // Extract meaningful parts from full ID
  // Example: "IND_BOB_5904000" → "BOB-4000" or just "4000"

  const parts = fullId.split("_");
  if (parts.length >= 3) {
    const region = parts[1]; // BOB, AS, IO, etc.
    const number = parts[2]; // 5904000

    // Extract last 4 digits for display
    const shortNumber = number.slice(-4);

    // Return region code + short number for better readability
    return `${region}-${shortNumber}`;
  }

  // Fallback: just show last 6 characters
  return fullId.slice(-6);
};

// Get region-based color for labels
export const getRegionColor = (region: string): string => {
  const regionColors: { [key: string]: string } = {
    "Bay of Bengal": "#3B82F6", // Blue
    "Arabian Sea": "#10B981", // Green
    "Indian Ocean": "#8B5CF6", // Purple
    "Pacific Ocean": "#F59E0B", // Amber
    "Southern Ocean": "#06B6D4", // Cyan
  };

  return regionColors[region] || "#6B7280";
};

// Format temperature for display
export const formatTemperature = (temp: number): string => {
  return `${temp.toFixed(1)}°C`;
};

// Format depth for display
export const formatDepth = (depth: number): string => {
  if (depth >= 1000) {
    return `${(depth / 1000).toFixed(1)}km`;
  }
  return `${depth}m`;
};

// Get status icon for display
export const getStatusIcon = (status: string): string => {
  const statusIcons: { [key: string]: string } = {
    active: "🟢",
    inactive: "🔴",
    maintenance: "🟡",
  };

  return statusIcons[status] || "⚪";
};

// Format date for display
export const formatLastTransmission = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffHours = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  );

  if (diffHours < 1) {
    return "Just now";
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffHours < 48) {
    return "Yesterday";
  } else {
    const days = Math.floor(diffHours / 24);
    return `${days}d ago`;
  }
};
