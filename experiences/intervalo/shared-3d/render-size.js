export function drawingRatio(width,height,dpr=1){
 return Math.max(1,Math.min(dpr,2,Math.sqrt(8294400/Math.max(1,width*height))));
}
export function resizeDrawing(renderer,width,height,dpr=1){
 width=Math.max(1,Math.round(width));height=Math.max(1,Math.round(height));
 const ratio=drawingRatio(width,height,dpr),canvas=renderer.domElement;
 if(Math.abs(renderer.getPixelRatio()-ratio)>.001)renderer.setPixelRatio(ratio);
 if(canvas.width!==Math.floor(width*ratio)||canvas.height!==Math.floor(height*ratio))renderer.setSize(width,height,false);
 canvas.style.width='100%';canvas.style.height='100%';
 canvas.dataset.renderSize=canvas.width+' × '+canvas.height;
 canvas.dataset.pixelRatio=ratio.toFixed(2);
 return {width,height};
}
