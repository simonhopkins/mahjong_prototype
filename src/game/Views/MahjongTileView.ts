import { Math } from "phaser";
import Util from "../Util";

export interface MahjongTileCallbacks {
    onPointerDown: (id: number) => void;
    onPointerUp: (id: number) => void;
}

export default class MahjongTileView extends Phaser.GameObjects.Container {
    private _boardCoord: Phaser.Math.Vector3;
    private _id: number;
    private _selectionSprite: Phaser.GameObjects.Sprite;
    private _disableSprite: Phaser.GameObjects.Sprite;
    private _selectionTween: Phaser.Tweens.Tween | null = null;
    private _gleamAnim: Phaser.GameObjects.Sprite;
    private _selectionOutlineAnim: Phaser.GameObjects.Sprite;
    constructor(
        scene: Phaser.Scene,
        graphicName: string,
        boardCoord: Phaser.Math.Vector3,
        callbacks: MahjongTileCallbacks
    ) {
        super(scene);
        this._boardCoord = boardCoord;
        this._id = MahjongTileView.Vector3ToId(this._boardCoord);
        //build up the tile
        const tileBacking = this.scene.add.sprite(0, 0, "tile");
        this.add(tileBacking);
        const symbol = this.scene.add.sprite(0, -10, graphicName);
        this.add(symbol);
        this._selectionSprite = this.scene.add.sprite(0, 0, "tileMask");
        this.add(this._selectionSprite);
        this._selectionSprite.alpha = 0;
        this._selectionSprite.tint = 0x2e2ea4;

        this._disableSprite = this.scene.add.sprite(0, 0, "tileMask");
        this.add(this._disableSprite);
        this._disableSprite.alpha = 0;
        this._disableSprite.tint = 0x0e0e0e;

        //gleamAnim
        this._gleamAnim = this.scene.add
            .sprite(0, 0, Util.GetGleamFrameNames()[3])
            .setScale(1.4, 1.4)
            .setAlpha(0);

        this.add(this._gleamAnim);

        // outlineAnim
        this._selectionOutlineAnim = this.scene.add
            .sprite(0, 0, Util.GetSelectionOutlineFrameNames()[0])
            .setScale(2.6, 2.6)
            .setPosition(-5, 62)
            .setAlpha(0);
        this.add(this._selectionOutlineAnim);
        this._selectionOutlineAnim.play("selectionOutline");

        const tileSize = MahjongTileView.GetTileSize();
        this.setSize(tileSize.x, tileSize.y);
        this.setInteractive();
        this.on(
            "pointerdown",
            (_: Phaser.Input.Pointer) => {
                callbacks.onPointerDown(this._id);
            },
            this
        );
        this.on(
            "pointerup",
            (_: Phaser.Input.Pointer) => {
                callbacks.onPointerUp(this._id);
            },
            this
        );
        // this.on("pointerover", this.onPointerOver, this);
        // this.on("pointerout", this.onPointerOut, this);
    }

    public Id() {
        return this._id;
    }
    public BoardCoord() {
        return this._boardCoord;
    }
    public Disable() {
        this._disableSprite.alpha = 0.7;
    }

    public Enable() {
        this._disableSprite.alpha = 0;
    }

    static GetTileSize() {
        return new Math.Vector3(145, 225, 20);
    }

    private static Vector3ToId(v: Phaser.Math.Vector3): number {
        // Assumes coordinates are small integers (e.g., 0-255)
        // Packs x, y, z into a single number
        return (v.x << 16) | (v.y << 8) | v.z;
    }

    public SelectionAnimation() {
        if (this._selectionTween) {
            this._selectionTween.complete();
        }
        this._selectionTween = this.scene.tweens.add({
            targets: this._selectionSprite,
            alpha: 0.3,
            duration: 300, // milliseconds
            ease: "Linear",
            onComplete: () => {
                this._selectionTween = null;
            },
        });
        this._gleamAnim.alpha = 1;
        this._gleamAnim.play("gleamAnim");

        this._selectionOutlineAnim.alpha = 1;
    }
    public DeselectAnimation() {
        if (this._selectionTween) {
            this._selectionTween.complete();
        }
        this._selectionTween = this.scene.tweens.add({
            targets: this._selectionSprite,
            alpha: 0,
            duration: 300, // milliseconds
            ease: "Linear",
            onComplete: () => {
                this._selectionTween = null;
            },
        });
        this._gleamAnim.alpha = 0;
        this._gleamAnim.stop();
        this._selectionOutlineAnim.alpha = 0;
    }

    public AnimatePulse(): void {
        this.scene.tweens.add({
            targets: this,
            scaleX: 1.4,
            scaleY: 1.4,
            duration: 300,
            ease: "Sine.easeInOut",
            yoyo: true,
            repeat: 0,
        });
    }
}
































































