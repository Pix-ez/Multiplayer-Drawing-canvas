type Draw = {
    ctx: CanvasRenderingContext2D
    currentPoint: Point
    prevPoint: Point | null
    roomId: string;  // Add roomId here
  }
  
  type Point = { x: number; y: number }
  