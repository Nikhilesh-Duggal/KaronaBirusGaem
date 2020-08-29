class Rectangle
{
    x1 = 0;
    y2 = 0;
    x2 = 0;
    y2 = 0;
    width = 0;
    height = 0;

    constructor(x, y, width, height) 
    {
        this.x1 = x;
        this.y1 = y;
        this.width = width;
        this.height = height;
        this.x2 = this.x1 + this.width;
        this.y2 = this.y1 + this.height;
    }

    setRect(x, y) 
    {
        this.x1 = x;
        this.y1 = y;
        this.x2 = this.x1 + this.width;
        this.y2 = this.y1 + this.height;
    }
    
}