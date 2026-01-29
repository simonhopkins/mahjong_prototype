export default class Util {
    static GetTileNames() {
        const numberPrefixes = ["bamboo", "characters", "dots"];

        const numberedNames = numberPrefixes.flatMap((item) =>
            new Array(9).fill(null).map((_, index) => `${item}_${index + 1}`)
        );
        const dragonNames = ["dragon_green", "dragon_red", "dragon_white"];
        const flowerNames = [
            "flower_bamboo",
            "flower_chrysanthemum",
            "flower_orchid",
            "flower_plum",
        ];
        const seasonNames = [
            "season_fall",
            "season_spring",
            "season_summer",
            "season_winter",
        ];
        const windNames = [
            "wind_east",
            "wind_north",
            "wind_south",
            "wind_west",
        ];
        return numberedNames
            .concat(flowerNames)
            .concat(dragonNames)
            .concat(seasonNames)
            .concat(windNames);
    }

    static GetSparkAnimFrameNames() {
        return new Array(10)
            .fill(0)
            .map((_, i) => `Unnamed_${(i + 16).toString().padStart(3, "0")}`);
    }
}

