import { Scene } from "phaser";
import MahjongBoardShapes from "../../MahjongBoardShapes";
import SetHelpers from "../SetHelpers";
import Util from "../Util";
import MahjongTileView, {
    MahjongTileCallbacks,
} from "../Views/MahjongTileView";

export class MainScene extends Scene {
    constructor() {
        super("MainScene");
    }

    private tileMap: Map<number, MahjongTileView> = new Map();
    private _waste: number[][] = [];
    private _targetBounds: Phaser.Geom.Rectangle;
    private _targetZoom: number;
    private _targetCenter: Phaser.Math.Vector2;

    private zoomBreakPoints = [0.8, 1.1, 1.6];

    private _selectedTiles: number[] = [];

    //sprites for the match animation
    private _matchGlowBacking: Phaser.GameObjects.Sprite;
    private _sparkAnim: Phaser.GameObjects.Sprite;
    private _disableInput = false;

    create() {
        this.GenerateBoard(MahjongBoardShapes.SwordBoard());
        const bounds = this.GetBounds();
        this._targetBounds = bounds;
        this._targetZoom = this.zoomBreakPoints[0];
        this._targetCenter = new Phaser.Math.Vector2(
            bounds.centerX,
            bounds.centerY
        );
        this.UpdateTargetBounds();
        //miscSpriteCreation
        this._matchGlowBacking = this.add
            .sprite(0, 0, "matchGlowBacking")
            .setAlpha(0);

        this.anims.create({
            key: "sparkAnim",
            frames: Util.GetSparkAnimFrameNames().map((name) => ({
                key: name,
            })),
            frameRate: 12,
        });

        // Play the animation on a sprite
        this._sparkAnim = this.add
            .sprite(0, 0, Util.GetSparkAnimFrameNames()[19])
            .setScale(1.4, 1.4);
        this._sparkAnim.blendMode = Phaser.BlendModes.SCREEN;
    }

    update(time: number, delta: number): void {
        const camera = this.cameras.main;
        const targetZoom = MainScene.GetTargetZoom(camera, this._targetBounds);
        // const breakpointZoom = this.zoomBreakPoints.reduce(
        //     (prev, curr) => (curr <= targetZoom ? curr : prev),
        //     this.zoomBreakPoints[0]
        // );
        // Get current center
        const currentX = camera.scrollX + camera.width / 2;
        const currentY = camera.scrollY + camera.height / 2;

        // Lerp (0.1 = 10% interpolation per frame)
        const newX = Phaser.Math.Linear(currentX, this._targetCenter.x, 0.1);
        const newY = Phaser.Math.Linear(currentY, this._targetCenter.y, 0.1);
        const newZoom = Phaser.Math.Linear(camera.zoom, this._targetZoom, 0.1);

        camera.centerOn(newX, newY);
        camera.setZoom(newZoom);
    }

    private static GetTargetZoom(
        camera: Phaser.Cameras.Scene2D.Camera,
        bounds: Phaser.Geom.Rectangle
    ) {
        const targetZoomX = camera.width / bounds.width;
        const targetZoomY = camera.height / bounds.height;
        const targetZoom = Math.min(targetZoomX, targetZoomY) * 0.9;
        return targetZoom;
    }

    private GenerateBoard(board: number[][][]) {
        const tileNames = Util.GetTileNames();
        const tileSize = MahjongTileView.GetTileSize();
        let level = 0;
        //generate the board
        const mahjongTileCallbacks: MahjongTileCallbacks = {
            onPointerDown: this.OnMahjongTileViewPointerDown.bind(this),
            onPointerUp: this.OnMahjongTileViewPointerUp.bind(this),
        };
        for (const levelArr of board) {
            //level is a 2d array
            for (let row = 0; row < levelArr.length; row++) {
                for (let col = 0; col < levelArr[row].length; col++) {
                    const xCoord = (col * tileSize.x) / 2;
                    const yCoord =
                        (row * tileSize.y) / 2 -
                        level * tileSize.z -
                        tileSize.z;
                    const boardCoord = new Phaser.Math.Vector3(col, row, level);
                    if (levelArr[row][col] == 1) {
                        const rndTile = Phaser.Math.RND.pick(tileNames);
                        const tile = new MahjongTileView(
                            this,
                            rndTile,
                            boardCoord,
                            mahjongTileCallbacks
                        );
                        this.tileMap.set(tile.Id(), tile);
                        this.add.existing(tile);
                        tile.setPosition(
                            xCoord + tileSize.x / 2,
                            yCoord + tileSize.y / 2
                        );
                    }
                }
            }
            level += 1;
        }
    }

    GetBounds() {
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        const allWaste = this._waste.flat();
        const filteredTileMap = Array.from(this.tileMap.keys()).filter(
            (id) => !allWaste.includes(id)
        );
        for (const tile of filteredTileMap.map((id) => this.tileMap.get(id)!)) {
            minX = Math.min(minX, tile.getBounds().left);
            maxX = Math.max(maxX, tile.getBounds().right);
            minY = Math.min(minY, tile.getBounds().top);
            maxY = Math.max(maxY, tile.getBounds().bottom);
        }

        return new Phaser.Geom.Rectangle(minX, minY, maxX - minX, maxY - minY);
    }

    OnMahjongTileViewPointerDown(id: number) {
        if (this._disableInput) {
            return;
        }
        const selectedTile = this.tileMap.get(id);
        console.log(selectedTile?.BoardCoord());
        if (selectedTile) {
            this.UpdateTargetBounds();
            const tileSelectedId = selectedTile.Id();

            const prevSelectedTiles = [...this._selectedTiles];
            if (this._selectedTiles.includes(tileSelectedId)) {
                this._selectedTiles = this._selectedTiles.filter(
                    (tileId) => tileId != tileSelectedId
                );
            } else {
                if (this._selectedTiles.length < 2) {
                    this._selectedTiles.push(tileSelectedId);
                }
            }

            this.AnimateSelectionChange(prevSelectedTiles, this._selectedTiles);
            if (this._selectedTiles.length == 2) {
                //animate the animation nice!
                this.AnimateTileCombination(this._selectedTiles);
            }
        }
    }

    private AnimateTileCombination(matchedTiles: number[]) {
        //state held in here probably
        //fade in backing glow
        //move tiles to the top
        this._disableInput = true;
        const tileViews = matchedTiles.map((id) => this.tileMap.get(id)!);
        const leftTile = tileViews.sort(
            (tileView) => tileView.getBounds().left
        )[0];
        const rightTile = tileViews.filter(
            (tile) => tile.Id() != leftTile.Id()
        )[0];
        const center = new Phaser.Math.Vector2(
            this.cameras.main.centerX,
            this.cameras.main.centerY
        );
        this.children.bringToTop(this._matchGlowBacking);
        this._matchGlowBacking.setPosition(center.x, center.y);
        this.tweens.add({
            targets: this._matchGlowBacking,
            alpha: 1,
            duration: 300, // milliseconds
            ease: "Linear",
        });
        this.children.bringToTop(leftTile);
        this.children.bringToTop(rightTile);

        const offsetFromCenter = 130;
        const rotateOutAngle = 11.63;
        const tileSize = MahjongTileView.GetTileSize();
        const endPositon = new Phaser.Math.Vector2(
            this.cameras.main.width,
            this.cameras.main.height
        );
        //left tile
        const leftMoveTween = this.tweens.chain({
            targets: leftTile,
            tweens: [
                {
                    x: center.x - offsetFromCenter + 10,
                    y: center.y + 15,
                    angle: -rotateOutAngle,
                    duration: 300, // milliseconds
                    ease: Phaser.Math.Easing.Back.Out,
                },
                {
                    x: center.x - tileSize.x / 2,
                    y: center.y - 10,
                    angle: 0,
                    delay: 200,
                    duration: 200, // milliseconds
                    ease: Phaser.Math.Easing.Back.Out,
                },
                {
                    x: endPositon.x,
                    y: endPositon.y,
                    angle: 0,
                    delay: 200,
                    duration: 400, // milliseconds
                    ease: Phaser.Math.Easing.Back.Out,
                },
            ],
        });
        leftTile.DeselectAnimation();
        rightTile.DeselectAnimation();
        const rightMoveTween = this.tweens.chain({
            targets: rightTile,
            tweens: [
                {
                    x: center.x + offsetFromCenter,
                    y: center.y + 10,
                    angle: rotateOutAngle,
                    duration: 300, // milliseconds
                    ease: Phaser.Math.Easing.Back.Out,
                },
                {
                    x: center.x + tileSize.x / 2,
                    y: center.y - 10,
                    angle: 0,
                    delay: 200,
                    duration: 200, // milliseconds
                    ease: Phaser.Math.Easing.Back.Out,
                },
                {
                    x: endPositon.x,
                    y: endPositon.y,
                    angle: 0,
                    delay: 200,
                    duration: 400, // milliseconds
                    ease: Phaser.Math.Easing.Back.Out,
                },
            ],
        });
        const timeline = this.add
            .timeline([
                {
                    at: 300,
                    run: () => {
                        this.children.bringToTop(this._sparkAnim);
                        this._sparkAnim.setPosition(center.x, center.y + 5);
                        this._sparkAnim.play("sparkAnim");
                    },
                },
                {
                    at: 500,
                    run: () => {
                        console.log("vibrate");
                        navigator.vibrate(200);
                    },
                },
                {
                    at: 1000,
                    run: () => {
                        this._disableInput = false;
                        this._waste.push(this._selectedTiles);
                        this._selectedTiles = [];
                        this.tweens.add({
                            targets: this._matchGlowBacking,
                            alpha: 0,
                            duration: 200, // milliseconds
                            ease: "Linear",
                        });
                    },
                },
            ])
            .play();
    }

    private AnimateSelectionChange(
        prevSelected: number[],
        currentSelection: number[]
    ) {
        const delectedTiles = SetHelpers.difference(
            new Set(prevSelected),
            new Set(currentSelection)
        );
        const newlySelectedTiles = SetHelpers.difference(
            new Set(currentSelection),
            new Set(prevSelected)
        );

        for (const id of newlySelectedTiles) {
            const tileView = this.tileMap.get(id)!;
            tileView.SelectionAnimation();
        }
        for (const id of delectedTiles) {
            const tileView = this.tileMap.get(id)!;
            tileView.DeselectAnimation();
        }
    }

    private GetBreakpointFromZoomLevel(zoomLevel: number) {
        return this.zoomBreakPoints.reduce(
            (prev, curr) => (curr <= zoomLevel ? curr : prev),
            this.zoomBreakPoints[0]
        );
    }
    private UpdateTargetBounds() {
        const newIdealBounds = this.GetBounds();
        const currentTargetZoom = MainScene.GetTargetZoom(
            this.cameras.main,
            this._targetBounds
        );
        const newIdealZoom = MainScene.GetTargetZoom(
            this.cameras.main,
            newIdealBounds
        );
        const currentBreakpoint =
            this.GetBreakpointFromZoomLevel(currentTargetZoom);
        const newBreakpoint = this.GetBreakpointFromZoomLevel(newIdealZoom);
        console.log(newIdealZoom);
        if (newBreakpoint != currentBreakpoint) {
            this._targetBounds = newIdealBounds;
            this._targetZoom = newBreakpoint;
            this._targetCenter = new Phaser.Math.Vector2(
                newIdealBounds.centerX,
                newIdealBounds.centerY
            );
        }
    }
    OnMahjongTileViewPointerUp(id: number) {}
}

