# ProvesKit Ground Station

Dashboard for viewing logs, sending commands, and managing other information for the PROVES Kit running [circuitpy_flight_software](https://github.com/proveskit/circuitpy_flight_software).

This project is made with Electron for easy cross-platform compatibility, as well as it having an easy to use IPC system for communicating between the frontend and backend. The repository was started off of the [Electron React Boilerplate](https://github.com/electron-react-boilerplate/electron-react-boilerplate) project to have a good base to start with.

## Development

To run the project and start developing:

1. Ensure you have Node.JS/npm & git installed
2. Run these commands:

```sh
git clone https://github.com/proveskit/proves-ground-station
cd proves-ground-station
npm install
npm start
```

As of now I've only tested that the connection to the board works on macOS, I'll test & ensure Windows and Linux work in the near future.
