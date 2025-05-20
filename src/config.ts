interface Config {
    baseUrl: string;
    protocol: "https" | "http";
  }
  
  const config: Config = {
    baseUrl: import.meta.env.VITE_API_BASE,
    protocol: import.meta.env.VITE_API_PROTOCOL,
  };
  
  export default config;
  