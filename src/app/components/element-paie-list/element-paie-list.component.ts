import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { Component, ElementRef, inject, NgModule, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElementPaie } from '../../model/elementpaie';
import { ElementpaieService } from '../../services/elementpaie.service';

@Component({
  selector: 'app-element-paie-list',
  imports: [FormsModule,ReactiveFormsModule,CommonModule],
  templateUrl: './element-paie-list.component.html',
  styleUrl: './element-paie-list.component.css'
})
export class ElementPaieListComponent implements OnInit {

  private readonly fb = inject (FormBuilder);
  private readonly elementService = inject (ElementpaieService);

  @ViewChild('elementForm') elementForm!: ElementRef;

  elements: ElementPaie[] = [];
  form !: FormGroup ;
  editing: ElementPaie | null = null;
  isEdit = false;
  loading = false;
  error: string | null = null;



 ngOnInit(): void {

    this.initForm()
  }

  private initForm(): void {

    this.form = this.fb.group({
      code:['', Validators.required],
      type: ['', Validators.required],
      formuleCalcul: ['', Validators.required],
      tauxDefaut: [null],
      categorie: ['', Validators.required],
      designation: ['', Validators.required],
      impacteSalaireBrut: [false],
      impacteBaseCnps: [false],
      impacteBaseIrpp: [false],
      impacteSalaireBrutImposable: [false],
      impacteBaseCreditFoncier: [false],
      impacteBaseAnciennete: [false],
      impacteNetAPayer: [false]
    }),
    this.reload();
  }

  reload() {
    this.loading = true;
    this.elementService.getAll().subscribe({
      next: elements => {
        this.elements = elements;
        this.loading = false;
      },
      error: err => {
        this.error = "Erreur lors du chargement";
        this.loading = false;
      }
    });
  }

  startEdit(element: ElementPaie) {
    this.editing = element;
    this.form.patchValue(element);

    this.elementForm.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  resetForm() {
    this.form.reset();
    this.editing = null;
  }

  submit() {
    if (this.form.invalid) return;
    const value = this.form.value as ElementPaie;
    if (this.editing) {
      // Modification
      this.elementService.update(this.editing.id!, value).subscribe({
        next: () => {
          this.reload();
          this.resetForm();
        },
        error: () => this.error = "Erreur lors de la modification"
      });
    } else {
      // Création
      this.elementService.create(value).subscribe({
        next: () => {
          this.reload();
          this.resetForm();
        },
        error: () => this.error = "Erreur lors de la création"
      });
    }
  }

  delete(element: ElementPaie) {
    if (!element.id) return;
    if (!confirm("Supprimer cet élément ?")) return;
    this.elementService.delete(element.id).subscribe({
      next: () => this.reload(),
      error: () => this.error = "Erreur lors de la suppression"
    });
  }
}
