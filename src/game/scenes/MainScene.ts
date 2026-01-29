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
    private _disableInput = false;

    private _debugCanvas: Phaser.GameObjects.Graphics;
    create() {
        this._debugCanvas = this.add.graphics();
        // Set line style (thickness, color, alpha)
        this._debugCanvas.lineStyle(10, 0xff0000, 1);
        this._debugCanvas.alpha = 0;
        this.initFrameAnimations();
        this.add
            .sprite(0, 0, "redBackdrop")
            .setPosition(this.cameras.main.centerX, this.cameras.main.centerY)
            .setOrigin(0.5, 0.5)
            .setScale(3, 3);
        this.resetBoard();
        this.GenerateBoard(MahjongBoardShapes.WizardHat());
        const bounds = this.GetBounds();
        const currentTargetZoom = MainScene.GetTargetZoom(
            this.cameras.main,
            bounds
        );
        this._targetBounds = bounds;
        this._targetZoom = this.GetBreakpointFromZoomLevel(currentTargetZoom);
        this._targetCenter = new Phaser.Math.Vector2(
            bounds.centerX,
            bounds.centerY
        );
        this.children.bringToTop(this._debugCanvas);
        this.UpdateTargetBounds();
        //miscSpriteCreation

        // Play the animation on a sprite
        this.initDebugKeys();
    }
    private resetBoard() {
        for (const tile of this.tileMap.values()) {
            tile.destroy();
        }
        this.tileMap.clear();
        this._waste = [];
    }

    private initDebugKeys() {
        const resetAndCenterOnBoard = (board: number[][][]) => {
            this.resetBoard();
            this.GenerateBoard(board);
            //hacky but whatever
            this._targetBounds = new Phaser.Geom.Rectangle(0, 0, 0, 0);
            this.UpdateTargetBounds();
        };

        this.input.keyboard?.on("keydown-ONE", () => {
            resetAndCenterOnBoard(MahjongBoardShapes.WizardHat());
        });
        this.input.keyboard?.on("keydown-TWO", () => {
            resetAndCenterOnBoard(MahjongBoardShapes.EasyMonument());
        });
        this.input.keyboard?.on("keydown-THREE", () => {
            resetAndCenterOnBoard(MahjongBoardShapes.Square());
        });
        this.input.keyboard?.on("keydown-FOUR", () => {
            resetAndCenterOnBoard(MahjongBoardShapes.SwordBoard());
        });
        this.input.keyboard?.on("keydown-FIVE", () => {
            resetAndCenterOnBoard(MahjongBoardShapes.Ziggurats());
        });
        this.input.keyboard?.on("keydown-SIX", () => {
            resetAndCenterOnBoard(MahjongBoardShapes.Flowers());
        });
        this.input.keyboard?.on("keydown-SEVEN", () => {
            resetAndCenterOnBoard(MahjongBoardShapes.Flowers());
        });
        this.input.keyboard?.on("keydown-EIGHT", () => {
            resetAndCenterOnBoard(MahjongBoardShapes.Turtle());
        });
        this.input.keyboard?.on("keydown-NINE", () => {
            resetAndCenterOnBoard(MahjongBoardShapes.Candle());
        });
    }

    private initFrameAnimations() {
        this.anims.create({
            key: "sparkAnim",
            frames: Util.GetSparkAnimFrameNames().map((name) => ({
                key: name,
            })),
            frameRate: 12,
        });
        this.anims.create({
            key: "gleamAnim",
            frames: Util.GetGleamFrameNames().map((name) => ({
                key: name,
            })),
            frameRate: 12,
            repeat: -1,
        });
        this.anims.create({
            key: "selectionOutline",
            frames: Util.GetSelectionOutlineFrameNames().map((name) => ({
                key: name,
            })),
            frameRate: 4,
            repeat: -1,
        });
    }

    update(time: number, delta: number): void {
        const camera = this.cameras.main;
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
    private GetTargetTilePos(tileId: number) {
        const tile = this.tileMap.get(tileId)!;
        const tileSize = MahjongTileView.GetTileSize();
        const boardCoord = tile.BoardCoord();
        const xCoord = (boardCoord.x * tileSize.x) / 2 + tileSize.x / 2;
        const yCoord =
            (boardCoord.y * tileSize.y) / 2 -
            boardCoord.z * tileSize.z + //offset for stacking
            tileSize.y / 2;
        const zOffset = boardCoord.y * tileSize.z;
        return new Phaser.Math.Vector2(xCoord, yCoord - zOffset);
    }
    private GenerateBoard(board: number[][][]) {
        const tileNames = Util.GetTileNames();
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
                        const targetPos = this.GetTargetTilePos(tile.Id());
                        // tile.setPosition(targetPos.x, targetPos.y);

                        tile.setPosition(targetPos.x, -1500);

                        this.tweens.add({
                            targets: tile,
                            y: targetPos.y,
                            duration: 500,
                            delay: boardCoord.y * 50, // 100ms delay between each tile
                            ease: Phaser.Math.Easing.Back.Out,
                        });
                        this.children.bringToTop(tile);
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
        const tileSize = MahjongTileView.GetTileSize();
        for (const tile of filteredTileMap.map((id) => this.tileMap.get(id)!)) {
            const tileTargetPos = this.GetTargetTilePos(tile.Id());
            const tileBounds = new Phaser.Geom.Rectangle(
                tileTargetPos.x,
                tileTargetPos.y,
                tileSize.x,
                tileSize.y
            );
            tileBounds.centerX = tileTargetPos.x;
            tileBounds.centerY = tileTargetPos.y;
            minX = Math.min(minX, tileBounds.left);
            maxX = Math.max(maxX, tileBounds.right);
            minY = Math.min(minY, tileBounds.top);
            maxY = Math.max(maxY, tileBounds.bottom);
        }

        return new Phaser.Geom.Rectangle(minX, minY, maxX - minX, maxY - minY);
    }

    OnMahjongTileViewPointerDown(id: number) {
        if (this._disableInput) {
            return;
        }
        const allWaste = this._waste.flat();
        if (allWaste.includes(id)) {
            return;
        }
        const selectedTile = this.tileMap.get(id);
        if (selectedTile) {
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
        this._waste.push(this._selectedTiles);
        this._selectedTiles = [];
        const tileViews = matchedTiles.map((id) => this.tileMap.get(id)!);
        const leftTile = tileViews.sort(
            (tileView) => tileView.getBounds().left
        )[0];
        const rightTile = tileViews.filter(
            (tile) => tile.Id() != leftTile.Id()
        )[0];
        const center = new Phaser.Math.Vector2(
            this.cameras.main.worldView.centerX,
            this.cameras.main.worldView.centerY
        );
        const matchGlowBacking = this.add
            .sprite(0, 0, "matchGlowBacking")
            .setAlpha(0);
        this.children.bringToTop(matchGlowBacking);
        matchGlowBacking.setPosition(center.x, center.y);
        this.tweens.add({
            targets: matchGlowBacking,
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
            this.cameras.main.height + 50
        );
        //createSparkAnim
        const sparkAnim = this.add
            .sprite(0, 0, Util.GetSparkAnimFrameNames()[19])
            .setScale(1.4, 1.4);
        sparkAnim.blendMode = Phaser.BlendModes.SCREEN;
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
                    x: endPositon.x - tileSize.x / 2,
                    y: endPositon.y,
                    angle: 0,
                    delay: 200,
                    duration: 400, // milliseconds
                    ease: Phaser.Math.Easing.Back.Out,
                },
            ],
        });
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
                    x: endPositon.x + tileSize.x / 2,
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
        const timeline = this.add
            .timeline([
                {
                    at: 300,
                    run: () => {
                        this.children.bringToTop(sparkAnim);
                        sparkAnim.setPosition(center.x, center.y + 5);
                        sparkAnim.play("sparkAnim");
                    },
                },
                {
                    at: 600,
                    run: () => {
                        console.log("vibrate");
                        navigator?.vibrate?.(100);
                        // this.cameras.main.shake(50, 0.02);
                    },
                },
                {
                    at: 1000,
                    run: () => {
                        this.tweens.add({
                            targets: matchGlowBacking,
                            alpha: 0,
                            duration: 200, // milliseconds
                            ease: "Linear",
                            onComplete: () => {
                                matchGlowBacking.destroy();
                                sparkAnim.destroy();
                                this.UpdateTargetBounds();
                            },
                        });
                    },
                },
                {
                    at: 1300,
                    run: () => {
                        //game over condition
                        if (
                            this._waste.flat().length ==
                            Array.from(this.tileMap.values()).length
                        ) {
                            window
                                ?.open(
                                    "https://blob.gifcities.org/gifcities/NNZ5KIGY3IQO6IYR27VW4DEVX6TRUCOD.gif",
                                    "_blank"
                                )
                                ?.focus();
                        }
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
        const breakpoint = this.zoomBreakPoints.reduce(
            (prev, curr) => (curr <= zoomLevel ? curr : prev),
            this.zoomBreakPoints[0]
        );
        console.log(`from ${zoomLevel} we got the breakpoint ${breakpoint}`);
        return breakpoint;
    }
    private UpdateTargetBounds() {
        const newIdealBounds = this.GetBounds();
        const currentTargetZoom = MainScene.GetTargetZoom(
            this.cameras.main,
            this._targetBounds
        );
        console.log(newIdealBounds);
        const newIdealZoom = MainScene.GetTargetZoom(
            this.cameras.main,
            newIdealBounds
        );
        this._debugCanvas.clear();

        // Draw the rectangle outline
        this._debugCanvas.strokeRect(
            newIdealBounds.x,
            newIdealBounds.y,
            newIdealBounds.width,
            newIdealBounds.height
        );
        const currentBreakpoint =
            this.GetBreakpointFromZoomLevel(currentTargetZoom);
        const newBreakpoint = this.GetBreakpointFromZoomLevel(newIdealZoom);
        if (newBreakpoint != currentBreakpoint) {
            this._targetZoom = newBreakpoint;
            console.log("change zoom to " + newBreakpoint);
            this._targetBounds = newIdealBounds;
            this.CenterTargetBounds();
        }
    }
    private CenterTargetBounds() {
        this._targetCenter = new Phaser.Math.Vector2(
            this._targetBounds.centerX,
            this._targetBounds.centerY
        );
    }
    OnMahjongTileViewPointerUp(id: number) {}
}
































































































































































































































