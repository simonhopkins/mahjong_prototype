import { AUTO, Game } from "phaser";
import { Boot } from "./scenes/Boot";
import { MainScene } from "./scenes/MainScene";
import { Preloader } from "./scenes/Preloader";

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1080, // Design width
        height: 1920, // Design height (9:16 portrait aspect ratio)
        parent: "game-container",
    },
    backgroundColor: "#028af8",
    scene: [Boot, Preloader, MainScene],
    input: {
        activePointers: 3,
    },
};

const StartGame = (parent: string) => {
    return new Game({ ...config, parent });
};

export default StartGame;
