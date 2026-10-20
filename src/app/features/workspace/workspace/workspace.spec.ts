import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClient } from '../../../core/api-client';
import { BranchService } from '../../../core/branch.service';
import { DefinitionsService } from '../../../core/definitions/definitions.service';
import { EntityLookupService } from '../../../core/entity-lookup.service';
import { Workspace } from './workspace';
import { WORKSPACES } from '../../../core/workspace-definitions';

describe('Workspace', () => {
  let apiMock: Record<string, ReturnType<typeof vi.fn>>;
  let branchServiceMock: {
    ensureBranches: ReturnType<typeof vi.fn>;
    branches: ReturnType<typeof vi.fn>;
    activeBranchId: ReturnType<typeof vi.fn>;
  };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    apiMock = {
      list: vi.fn().mockReturnValue(of({ ok: true, data: [] })),
      request: vi.fn().mockReturnValue(of({ ok: true, data: {} })),
      create: vi.fn().mockReturnValue(of({ ok: true, data: {} })),
      update: vi.fn().mockReturnValue(of({ ok: true, data: {} })),
      remove: vi.fn().mockReturnValue(of({ ok: true, data: {} })),
    };

    branchServiceMock = {
      ensureBranches: vi.fn().mockResolvedValue([]),
      branches: vi.fn().mockReturnValue([]),
      activeBranchId: vi.fn().mockReturnValue(''),
    };

    routerMock = {
      navigate: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [Workspace],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: { definition: WORKSPACES['payments'] },
              queryParamMap: { get: () => null },
            },
          },
        },
        { provide: Router, useValue: routerMock },
        { provide: ApiClient, useValue: apiMock },
        { provide: BranchService, useValue: branchServiceMock },
        DefinitionsService,
        EntityLookupService,
      ],
    }).compileComponents();
  });

  it('should create the workspace component', () => {
    const fixture = TestBed.createComponent(Workspace);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should resolve options for lookup fields dynamically', () => {
    const fixture = TestBed.createComponent(Workspace);
    const component = fixture.componentInstance;
    const methodField = WORKSPACES['payments'].fields?.find((f) => f.key === 'method');
    expect(methodField).toBeDefined();
    if (methodField) {
      const options = (component as any).optionsForField(methodField);
      expect(options.length).toBeGreaterThan(0);
      expect(options.some((o: any) => o.value === 'cash' || o.value === 'card')).toBe(true);
    }
  });
});
