import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaConfirmationService, KometaTray } from './kometa-tray';

@Component({ imports: [KometaTray], template: `<k-tray />` })
class Host {}

describe('KometaTray', () => {
  async function render() {
    const f = TestBed.createComponent(Host);
    document.body.appendChild(f.nativeElement);
    f.detectChanges();
    const el = f.nativeElement as HTMLElement;
    const confirmation = TestBed.inject(KometaConfirmationService);
    const settle = async () => { f.detectChanges(); await f.whenStable(); f.detectChanges(); };
    const dlg = () => el.querySelector('dialog') as HTMLDialogElement;
    const btn = (cls: string) => el.querySelector(`button.${cls}`) as HTMLButtonElement;
    return { el, confirmation, settle, dlg, btn };
  }

  const ask = { header: 'Delete service?', message: 'Gone for good.', acceptLabel: 'Delete', rejectLabel: 'Keep it', acceptButtonProps: { severity: 'danger' } } as const;

  it('is closed until a confirmation is asked, then names the question and offers both answers', async () => {
    const { confirmation, settle, dlg, el } = await render();
    expect(dlg().hasAttribute('open')).toBe(false);
    confirmation.confirm({ ...ask, accept: () => {} });
    await settle();
    expect(dlg().hasAttribute('open')).toBe(true);
    expect(el.querySelector('h2')!.textContent).toBe('Delete service?');
    expect(el.querySelector('p')!.textContent).toBe('Gone for good.');
    expect(dlg().getAttribute('aria-labelledby')).toBe(el.querySelector('h2')!.id);
    expect(el.querySelector('button.go')!.textContent).toBe('Delete');
    expect(el.querySelector('button.stay')!.textContent).toBe('Keep it');
  });

  it('draws a danger accept in red, and any other accept plain', async () => {
    const { confirmation, settle, btn } = await render();
    confirmation.confirm({ ...ask });
    await settle();
    expect(btn('go').classList.contains('danger')).toBe(true);
    confirmation.confirm({ message: 'Upgrade?', acceptLabel: 'Yes', rejectLabel: 'No' });
    await settle();
    expect(btn('go').classList.contains('danger')).toBe(false);
  });

  it('a message with no header becomes the heading', async () => {
    const { confirmation, settle, el } = await render();
    confirmation.confirm({ message: 'Leave without saving?', acceptLabel: 'Leave', rejectLabel: 'Stay' });
    await settle();
    expect(el.querySelector('h2')!.textContent).toBe('Leave without saving?');
    expect(el.querySelector('p')).toBeNull();
  });

  it('accept calls accept once and closes', async () => {
    const { confirmation, settle, btn, dlg } = await render();
    const accept = vi.fn();
    const reject = vi.fn();
    confirmation.confirm({ ...ask, accept, reject });
    await settle();
    btn('go').click();
    await settle();
    expect(accept).toHaveBeenCalledTimes(1);
    expect(reject).not.toHaveBeenCalled();
    expect(dlg().hasAttribute('open')).toBe(false);
  });

  it('the quiet answer, Escape and the dark area all reject', async () => {
    const { confirmation, settle, btn, dlg } = await render();
    const reject = vi.fn();
    confirmation.confirm({ ...ask, reject });
    await settle();
    btn('stay').click();
    await settle();
    confirmation.confirm({ ...ask, reject });
    await settle();
    dlg().dispatchEvent(new Event('cancel', { cancelable: true }));
    await settle();
    confirmation.confirm({ ...ask, reject });
    await settle();
    dlg().click();
    await settle();
    expect(reject).toHaveBeenCalledTimes(3);
    expect(dlg().hasAttribute('open')).toBe(false);
  });

  it('a click inside the box is not the dark area', async () => {
    const { confirmation, settle, el, dlg } = await render();
    const reject = vi.fn();
    confirmation.confirm({ ...ask, reject });
    await settle();
    (el.querySelector('h2') as HTMLElement).click();
    expect(reject).not.toHaveBeenCalled();
    expect(dlg().hasAttribute('open')).toBe(true);
  });

  it('ignores a confirmation that carries a key: it belongs to another dialog', async () => {
    const { confirmation, settle, dlg } = await render();
    confirmation.confirm({ ...ask, key: 'admin-confirm-0' });
    await settle();
    expect(dlg().hasAttribute('open')).toBe(false);
  });
});
