# ngx-lightning

<a href="https://ngxui.com" target="_blank" style="display: flex;gap: .5rem;align-items: center;cursor: pointer; padding: 0 0 0 0; height: fit-content;">
  <img src="https://ngxui.com/assets/img/ngxui-logo.png" style="width: 64px;height: 64px;">
</a>

This library is part of the NGXUI ecosystem. View all available components at [https://ngxui.com](https://ngxui.com)

`@omnedia/ngx-lightning` is an Angular library that renders a performant animated lightning/electricity effect using WebGL. The effect is smooth, customizable, and highly performant for hero backgrounds, overlays, and live backgrounds.

## Features

* Native WebGL, GPU-accelerated lightning/electricity animation.
* Highly customizable via Inputs: hue, speed, offset, intensity, size, etc.
* Fully responsive, resizes to fit container.
* Standalone Angular 20, SSR-safe, zone-free, signal-based.
* Pauses animation when not in view (IntersectionObserver).
* Zero dependencies.

## Installation

```sh
npm install @omnedia/ngx-lightning
```

## Usage

Import the `NgxLightningComponent` in your Angular module or component:

```typescript
import { NgxLightningComponent } from '@omnedia/ngx-lightning';

@Component({
  ...
  imports: [
    ...
    NgxLightningComponent,
  ],
  ...
})
```

Use the component in your template:

```html
<div class="lightning-demo">
  <om-lightning
    [hue]="260"
    [xOffset]="0.1"
    [speed]="2"
    [intensity]="1.6"
    [size]="1.1"
    [flashTimeOut]="5000"
    [transparent]="false"
    styleClass="custom-lightning"
  ></om-lightning>
</div>
```

## API

```html
<om-lightning
  [hue]="hue"
  [xOffset]="xOffset"
  [speed]="speed"
  [intensity]="intensity"
  [size]="size"
  [flashTimeOut]="flashTimeOut"
  [transparent]="transparent"
  styleClass="your-custom-class"
></om-lightning>
```

* `hue` (optional): Lightning color, hue value in degrees (default: `230`).
* `xOffset` (optional): Horizontal offset of the bolt/arc (default: `0`).
* `speed` (optional): Animation speed (default: `1`).
* `intensity` (optional): Lightning intensity/brightness (default: `1`).
* `size` (optional): Size/scale of the lightning (default: `1`).
* `flashTimeOut` (optional): TimeOut in ms between lightning animation. If undefined the animation is continuous. (default: `undefined`).
* `transparent` (optional): Sets the background transparent (default: `false`).
* `styleClass` (optional): Additional class for custom styling.

## Styling

The lightning canvas is absolutely positioned and fills its container. Use CSS to set your desired size/aspect:

```css
.lightning-demo {
  width: 100vw;
  height: 40vh;
  position: relative;
  background: #000;
  overflow: hidden;
}
.custom-lightning {
  filter: blur(0.5px);
}
```

## Notes

* The animation auto-pauses when scrolled out of view for best performance.
* Works with SSR, all DOM access is guarded by browser checks.
* No dependencies, ships as a standalone Angular component.

## Contributing

Contributions are welcome. Please submit a pull request or open an issue to discuss your ideas.

## License

MIT
