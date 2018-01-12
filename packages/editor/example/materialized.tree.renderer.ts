
import { TreeMasterDetailRenderer } from '../src/tree/tree-renderer';
import { JsonSchema } from '@jsonforms/core';
declare let $;

class MaterializedTreeMasterDetailRenderer extends TreeMasterDetailRenderer {

  protected renderDetail(element: Object, label: HTMLLIElement, schema: JsonSchema) {
    super.renderDetail(element, label, schema);

    // init selects and remove description option when the reference is already set
    setTimeout(() => {
      const selectList = $('select');
      for (const item of selectList) {
        const select = item as HTMLSelectElement;
        if (select.selectedIndex > 0) {
          select.options[0].remove();
        }
      }
      // selectList.material_select();
    }, 100);
  }
}
