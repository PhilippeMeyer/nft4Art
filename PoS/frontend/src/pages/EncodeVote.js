export default function EncodeVote(items) {
    let ret;
    let pos = 0;
  
    items.forEach((item) => {
      let component = document.getElementById(item.id);
  
      switch(item.type) {
        case 'date':
        case 'ranking':
        case 'choose':
          if (item.labels === undefined) break;
          console.log(component.value);
        case 'option':
            if (item.labels === undefined) break;
        case 'slider':
        case 'checkbox':
            if (item.labels === undefined) break;
       
      }
    })
  }