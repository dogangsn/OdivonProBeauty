import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { SearchableSelect, SearchableSelectOption } from './searchable-select';

describe('SearchableSelect', () => {
  let fixture: ComponentFixture<SearchableSelect>;
  let component: SearchableSelect;

  const mockOptions: SearchableSelectOption[] = [
    { value: 'srv_1', label: 'Lazer Epilasyon', badge: '45 dk · ₺1200', icon: 'spa' },
    { value: 'srv_2', label: 'Cilt Bakımı', badge: '60 dk · ₺900', icon: 'spa' },
    { value: 'srv_3', label: 'Kalıcı Oje & Manikür', badge: '40 dk · ₺450', icon: 'spa' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchableSelect],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchableSelect);
    component = fixture.componentInstance;
  });

  it('initializes in closed state with placeholder', () => {
    fixture.componentRef.setInput('options', mockOptions);
    fixture.componentRef.setInput('placeholder', 'Hizmet Seçin');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Hizmet Seçin');
    expect(element.querySelector('.searchable-dropdown-panel')).toBeFalsy();
  });

  it('opens dropdown on click and displays options list', () => {
    fixture.componentRef.setInput('options', mockOptions);
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('.searchable-trigger') as HTMLElement;
    trigger.click();
    fixture.detectChanges();

    const dropdown = fixture.nativeElement.querySelector('.searchable-dropdown-panel');
    expect(dropdown).toBeTruthy();
    expect(dropdown.textContent).toContain('Lazer Epilasyon');
    expect(dropdown.textContent).toContain('45 dk · ₺1200');
    expect(dropdown.textContent).toContain('Cilt Bakımı');
  });

  it('filters options in real-time when user types in search box', () => {
    fixture.componentRef.setInput('options', mockOptions);
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('.searchable-trigger') as HTMLElement;
    trigger.click();
    fixture.detectChanges();

    const searchInput = fixture.nativeElement.querySelector('.searchable-input') as HTMLInputElement;
    searchInput.value = 'lazer';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const options = fixture.nativeElement.querySelectorAll('[role="option"]');
    expect(options.length).toBe(1);
    expect(options[0].textContent).toContain('Lazer Epilasyon');
  });

  it('selects option on click, updates model and emits selectionChange', () => {
    fixture.componentRef.setInput('options', mockOptions);
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('.searchable-trigger') as HTMLElement;
    trigger.click();
    fixture.detectChanges();

    let emitted: SearchableSelectOption | null = null;
    component.selectionChange.subscribe((val) => (emitted = val));

    const secondOption = fixture.nativeElement.querySelectorAll('[role="option"]')[1] as HTMLElement;
    secondOption.click();
    fixture.detectChanges();

    expect(component.value()).toBe('srv_2');
    expect(emitted).toEqual(mockOptions[1]);
    expect(fixture.nativeElement.textContent).toContain('Cilt Bakımı');
    expect(fixture.nativeElement.querySelector('.searchable-dropdown-panel')).toBeFalsy();
  });

  it('caps rendered items to 40 for DOM performance with large lists', () => {
    const manyOptions: SearchableSelectOption[] = Array.from({ length: 120 }, (_, i) => ({
      value: `opt_${i}`,
      label: `Hizmet ${i}`,
      badge: '30 dk',
    }));

    fixture.componentRef.setInput('options', manyOptions);
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('.searchable-trigger') as HTMLElement;
    trigger.click();
    fixture.detectChanges();

    const rendered = fixture.nativeElement.querySelectorAll('[role="option"]');
    expect(rendered.length).toBe(40);
  });
});
