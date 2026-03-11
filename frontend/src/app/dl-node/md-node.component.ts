import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef, OnChanges, SimpleChanges, inject } from '@angular/core';
import { DlNode } from './dl-node.model';
import { DlNodeComponent } from './dl-node.component';
import { toDocLang, simplify } from './md-to-doclang';
import { assignHeadingIds } from './slug';

@Component({
  selector: 'md-node',
  standalone: true,
  imports: [DlNodeComponent],
  templateUrl: './md-node.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MdNodeComponent implements OnChanges {
  @Input() markdown!: string;
  dlNode: DlNode | null = null;

  private cd = inject(ChangeDetectorRef);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['markdown']) {
      const md = this.markdown;
      if (!md) {
        this.dlNode = null;
        return;
      }
      toDocLang(md).then(node => {
        const simplified = simplify(node);
        assignHeadingIds(simplified);
        this.dlNode = simplified;
        this.cd.markForCheck();
      });
    }
  }
}
