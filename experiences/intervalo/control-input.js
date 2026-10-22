// One activation per touch, including Safari compatibility clicks. Scroll gestures are ignored.
export function bindActivation(button, action) {
  let press = null, lastTouch = -Infinity;
  button.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch' || event.pointerType === 'pen')
      press = {id:event.pointerId, x:event.clientX, y:event.clientY, at:event.timeStamp};
  });
  button.addEventListener('pointercancel', () => { press = null; });
  button.addEventListener('pointerup', event => {
    const start = press; press = null;
    if (!start || start.id !== event.pointerId || button.disabled) return;
    if (Math.hypot(event.clientX-start.x,event.clientY-start.y)>10 || event.timeStamp-start.at>1500) return;
    event.preventDefault(); lastTouch = event.timeStamp; action(event);
  });
  button.addEventListener('click', event => {
    if (button.disabled) return;
    if (event.detail !== 0 && event.timeStamp-lastTouch<800) { event.preventDefault(); return; }
    action(event);
  });
}
