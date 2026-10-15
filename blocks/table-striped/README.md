# table-striped

Custom **table** block. Purpose: data-table.

## Authoring (Document Authoring)

Model: `collection`

Repeating rows — one row per item. Each item: container with repeating row items (1-4 rich-text cells each); first row is the header row unless the no-header option is set. Source: header ['Activité évaluée par le NSAA', 'Ce que cela signifie au quotidien'] + 4 rows x 2 cells.

## Supported variations

| Variation | Option class |
| --- | --- |
| No header row | `no-header` |
| Bordered | `bordered` |

## Universal Editor fields

- Content fields derived from the block's decorate contract.
- `classes` select for options: No header row, Bordered.
- A separate `-item` model defines one repeated item.
