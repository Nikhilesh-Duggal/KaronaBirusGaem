class Difficulty
{
    static _difficulty = 0;

    static changeDifficulty()
    {
        this._difficulty = this._difficulty == 0 ? 1 : 0;

        document.getElementsByTagName("button")[0].innerHTML = "Set difficulty to " + 
        (this._difficulty == 0 ? "HARD" : "EASY");
    }
}