"use strict";
exports.dispatchFilteredList = (listFiltered, originalListe) => {
  console.log("dispatcher")
  let copyItemSource = originalListe;
  let copieItemsSourceFiltered = listFiltered;
  let itemsList = listFiltered;
  let ovorwide = [];
  const result = dispatchChildreen(
    copieItemsSourceFiltered,
    copyItemSource,
    itemsList,
    ovorwide
  );
  console.log("=====",result);
  itemsList = result.itemsList.filter(item => !result.ovorwide.includes(item));
  
  return itemsList;
};

const dispatchChildreen = (
  copieItemsSourceFiltered,
  copyItemSource,
  itemsList,
  ovorwide
) => {
  for (let index = 0; index < itemsList.length; index++) {
    let current = itemsList[index];
     console.log(current.fullPath)
    if (copieItemsSourceFiltered.indexOf(current) !== -1) {
      let resultFromParent = findParent(
        current,
        copyItemSource,
        copieItemsSourceFiltered
      );

      current = resultFromParent.current;

      copyItemSource = resultFromParent.copyItemSourceRendu;

      let childrens = findChildrens(current, copieItemsSourceFiltered);

      copyItemSource = deleteFromcopyItemSource(current, copyItemSource);

      if (childrens.length > 0) {
        const listFromChildren = dispatchChildreen(
          copieItemsSourceFiltered,
          copyItemSource,
          childrens,
          ovorwide
        );
        itemsList[index] = {
          ...current,
          childrens: [...listFromChildren.itemsList]
        };
        copieItemsSourceFiltered = listFromChildren.copieItemsSourceFiltered;
        copyItemSource = listFromChildren.copyItemSource;
      }
      copieItemsSourceFiltered = deleteFromFilteredList(
        current,
        copieItemsSourceFiltered
      );
    } else {
      ovorwide.push(current);
    }
  }

  return { copieItemsSourceFiltered, copyItemSource, itemsList, ovorwide };
};

const findChildrens = (current, copieItemsSourceFiltered) => {
  let childrens = [];

  childrens = copieItemsSourceFiltered.filter(
    item => item.hasOwnProperty("parent") && item.parent === current._id
  );

  return childrens;
};

const deleteFromFilteredList = (current, copieItemsSourceFilteredRendu) => {
  const list = copieItemsSourceFilteredRendu.filter(
    item => item._id !== current._id
  );
  return list;
};

const findParent = (current, copyItemSource, copieItemsSourceFiltered) => {
  let parent = undefined;

  if (!copieItemsSourceFiltered.includes(current))
    copieItemsSourceFiltered.push(current);
  parent = current.hasOwnProperty("parent")
    ? copyItemSource.find(item => item._id === current.parent)
    : undefined;
  if (parent === undefined) {
    const list = deleteFromcopyItemSource(current, copyItemSource);
    return {
      current,
      copyItemSourceRendu: list,
      copieItemsSourceFiltered
    };
  } else {
    copyItemSource = deleteFromcopyItemSource(current, copyItemSource);
    return findParent(parent, copyItemSource, copieItemsSourceFiltered);
  }
};

const deleteFromcopyItemSource = (element, copyItemSource) => {
  copyItemSource = copyItemSource.filter(item => item._id !== element._id);
  return copyItemSource;
};
