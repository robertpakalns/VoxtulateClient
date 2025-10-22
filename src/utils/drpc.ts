import { Socket, createConnection } from "net";
import packageJson from "../../package.json";
import { Config } from "./config.js";
import { existsSync } from "fs";
import { tmpdir } from "os";

const config = new Config();

const staticLinks: Record<string, string> = {
  "/": "Viewing main lobby",
  "/experimental": "Viewing main lobby",
  "/loadouts": "Viewing their inventory",
  "/loadouts/inventory": "Viewing their inventory",
  "/loadouts/market": "Viewing market",
  "/loadouts/sales": "Viewing their sales",
  "/loadouts/history": "Viewing their sales history",
  "/changelog": "Viewing changelog",
  "/settings": "Viewing settings",
  "/friends": "Viewing their friends",
  "/friends/list": "Viewing their friends",
  "/friends/requests": "Viewing their friend requests",
  "/clans": "Viewing their clan",
  "/clans/active": "Viewing their clan",
  "/clans/search": "Viewing clans",
};

const dynamicLinks: Record<string, Function> = {
  "/account": () => "Viewing their account",
  "/player": (name: string) => `Viewing player: ${name}`,
  "/leaderboard": (type: string) => `Viewing leaderboard: ${type}`,
  "/shop": () => "Viewing shop",
  "/clans/view": (name: string) => `Viewing clan: ${name}`,
};

const { joinButton } = config.get("discord") as {
  joinButton: string;
};

type DiscordOpCode = 0 | 1 | 2 | 3;

function getIPCPaths(): string[] {
  const paths: string[] = [];
  const dir =
    process.platform === "win32" ? "" : process.env.XDG_RUNTIME_DIR || tmpdir();

  for (let i = 0; i <= 10; i++) {
    const path =
      process.platform === "win32"
        ? `\\\\?\\pipe\\discord-ipc-${i}`
        : `${dir}/discord-ipc-${i}`;
    paths.push(path);
  }

  return paths;
}

function writePacket(op: DiscordOpCode, data: any): Buffer {
  const json = Buffer.from(JSON.stringify(data), "utf8");
  const header = Buffer.alloc(8);
  header.writeInt32LE(op, 0);
  header.writeInt32LE(json.length, 4);
  return Buffer.concat([header, json]);
}

class DiscordRPC {
  private clientId = "1294677913131810916";
  private socket: Socket | null = null;
  private connected = false;
  private protocol = "voxtulate://";
  private joinURL = "voxtulate://";
  private state = "Playing Voxiom.io";
  private startTime = Date.now();

  constructor() {
    this.connectIPC();
  }

  private connectIPC() {
    const paths = getIPCPaths();

    const tryConnect = (i = 0) => {
      if (i >= paths.length) {
        return;
      }

      const path = paths[i];
      if (!existsSync(path) && process.platform !== "win32") {
        return tryConnect(i + 1);
      }

      const socket = createConnection(path, () => {
        this.socket = socket;
        this.connected = true;
        this.handshake();
      });

      socket.on("error", () => {
        socket.destroy();
        tryConnect(i + 1);
      });

      socket.on("close", () => {
        this.connected = false;
      });
    };

    tryConnect();
  }

  private handshake() {
    const packet = writePacket(0, {
      v: 1,
      client_id: this.clientId,
    });
    this.socket!.write(packet);
    this.setActivity();
    setInterval(() => this.connected && this.heartbeat(), 15000);
  }

  private heartbeat() {
    this.socket!.write(writePacket(3, {}));
  }

  private setActivity() {
    if (!this.connected) return;

    const buttons = [
      {
        label: "Download Client",
        url: "https://github.com/robertpakalns/VoxtulateClient/releases/latest",
      },
    ];

    if (joinButton) buttons.unshift({ label: "Join Game", url: this.joinURL });

    const activity = {
      cmd: "SET_ACTIVITY",
      args: {
        pid: process.pid,
        activity: {
          state: this.state,
          timestamps: { start: this.startTime },
          assets: {
            large_image: "voxtulate",
            large_text: `Voxtulate Client v${packageJson.version}`,
          },
          buttons,
        },
      },
      nonce: Date.now().toString(),
    };

    this.socket!.write(writePacket(1, activity));
  }

  setJoinURL(path: string) {
    if (!this.connected) return;

    let result = "Playing Voxiom.io";

    if (path.startsWith("/#") || path.startsWith("/experimental#"))
      result = "Playing a match";
    else if (staticLinks[path]) result = staticLinks[path];
    else {
      for (const key in dynamicLinks) {
        if (path.startsWith(key)) {
          result = dynamicLinks[key](path.replace(`${key}/`, "").split("/")[0]);
          break;
        }
      }
    }

    this.state = result;
    this.joinURL =
      path === "/" ? this.protocol : `${this.protocol}?url=${path}`;
    this.setActivity();
  }
}

export default DiscordRPC;
