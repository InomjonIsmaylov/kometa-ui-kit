import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Click's or Payme's own mark, verbatim from the vendor's brand kit — never redrawn or recoloured.
 *
 * Always on a small white plate: Payme's "me" block is black and vanishes on a dark surface, and
 * either mark vanishes on its own brand-filled button (`a.primary.click`, the console's `.brand`
 * chips). The art may not change, so the surface under it does; both get it so the pair matches.
 *
 * `aria-hidden` because every caller keeps the text label that already names the provider. Sized in
 * `em`, so it follows the label it sits beside.
 *
 * `provider` takes the wire's `'Click' | 'Payme'` as well as the vendor console's lower-case ids.
 *
 * Telegram, Google and Instagram are gradient art (several kB each), so they are NOT inlined: the app
 * ships them as static files, `brand/*.svg` (not part of this kit), loaded by a relative `<img>` that
 * honours the app's `<base href>`. Inlining them would put their bytes in every chunk that imports
 * this component.
 */
@Component({
  selector: 'k-provider-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  styles: `
    :host {
      display: inline-block;
      flex: none;
      width: var(--provider-logo-size, 1.25em);
      height: var(--provider-logo-size, 1.25em);
      padding: 0.125em;
      margin-inline-end: var(--provider-logo-gap, 0.5em);
      box-sizing: border-box;
      border-radius: var(--provider-logo-radius, 0.3em);
      background: var(--provider-logo-plate, #fff);
      vertical-align: -0.3em;
      line-height: 0;
    }
    svg, img { width: 100%; height: 100%; }
  `,
  template: `
    @if (provider() === 'telegram' || provider() === 'google' || provider() === 'instagram') {
      <img [src]="'brand/' + provider() + '.svg'" alt="" />
    } @else if (provider() === 'click' || provider() === 'Click') {
      <svg viewBox="0 0 40 40"><path fill-rule="evenodd" clip-rule="evenodd" fill="#0065FF" d="M39.3739 20.1572C39.3739 27.7941 27.2594 40.0006 19.6797 40.0006C12.1 40.0006 -0.0146637 27.7941 -0.0146637 20.1572C-0.0146637 12.5203 12.1 0.313477 19.6797 0.313477C27.2594 0.313477 39.3739 12.5203 39.3739 20.1572ZM27.5573 20.1572C27.5573 23.212 22.7113 28.0945 19.6797 28.0945C16.6477 28.0945 11.8019 23.212 11.8019 20.1572C11.8019 17.1025 16.6479 12.2197 19.6797 12.2197C22.7113 12.2197 27.5573 17.1025 27.5573 20.1572Z"/></svg>
    } @else {
      <svg viewBox="0 0 933 933"><path fill="black" d="M715.483 450.74C724.438 450.74 732.361 454.444 736.844 461.563L815.675 589.427C821.732 599.446 820.697 611.561 811.972 621.58L700.957 749.446C694.9 756.305 686.976 760.526 678.019 760.526H147.157C131.598 760.526 120.258 748.383 122.095 733.112L151.377 478.156C153.243 462.597 166.678 450.74 182.238 450.74H715.483ZM625.714 504.884C567.61 504.884 518.404 539.362 517.629 614.892V614.92C516.854 663.35 552.107 708.278 624.163 708.278C649.714 708.278 671.416 703.253 690.794 691.225L694.67 645.522C678.795 655.226 654.766 661.8 633.867 661.8C606.365 661.8 581.561 649.771 574.614 621.896H708.651C710.574 616.872 712.124 604.843 712.124 593.217C712.124 542.089 683.818 504.884 625.714 504.884ZM447.239 504.597C422.837 504.597 396.856 518.548 379.43 531.323C372.081 514.271 355.804 504.597 332.953 504.597C310.102 504.597 288.026 515.851 270.6 527.448L272.925 510.022H221.796L197.396 703.714H251.94V703.627L269.767 561.868C281.795 553.744 295.317 547.142 306.973 547.142C322.073 547.142 329.421 558.395 327.125 577.744L311.623 703.656H366.254L383.306 566.146L383.679 562.271C395.707 554.146 409.631 547.17 421.258 547.17C436.358 547.17 443.707 558.424 441.41 577.772L425.909 703.685H480.539L497.591 566.175C502.242 527.821 482.463 504.597 447.239 504.597ZM621.81 548.261C644.661 548.261 657.063 561.064 657.063 581.59C657.063 583.916 657.063 586.614 656.69 588.939H574.958C580.384 563.39 598.959 548.261 621.81 548.261Z"/><path fill="#00c0c9" d="M448.179 311.732C448.179 290.575 472.867 282.766 498.302 282.766H524.139L520.207 314.488C509.24 323.101 489.661 332.114 473.212 332.114C458.341 332.114 448.15 323.904 448.15 311.732H448.179ZM392.945 316.067C392.543 347.789 418.409 373.655 457.939 373.655C485.757 373.655 506.111 361.914 517.852 348.966L515.499 368.947H568.751L581.669 262.814C587.956 210.337 570.703 167.648 503.326 167.648C475.91 167.648 442.638 173.935 424.61 185.677L419.126 229.542C433.624 221.705 461.815 212.145 487.651 212.145C518.57 212.145 529.565 227.59 528.359 244.039H495.46C447.691 244.039 393.232 262.441 392.859 316.096H392.916L392.945 316.067ZM239.818 321.149L251.962 224.834C263.703 215.446 277.024 211.514 288.765 211.916C312.247 212.289 325.195 231.092 325.195 260.489C325.195 298.47 305.214 330.966 271.54 330.966C260.976 330.966 248.833 327.464 239.818 321.177V321.149ZM171.293 433.539H226.125L235.139 359.531C243.751 366.191 259.827 373.626 280.152 373.626C343.596 373.626 382.381 317.617 382.381 256.556C382.381 204.48 357.692 168.05 311.501 168.05C289.569 168.05 269.588 175.084 254.315 187.629L256.267 173.16H203.015L171.293 433.596V433.539ZM747.741 173.103L688.203 308.603L657.285 173.103H596.196L650.625 369.292L618.903 433.539H679.218L807.286 173.103H747.741Z"/></svg>
    }
  `,
})
export class ProviderLogo {
  readonly provider = input.required<string>();
}
