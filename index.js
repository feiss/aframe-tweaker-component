AFRAME.registerSystem('tweak', {
  init: function(){
    this.entity = 0;
    this.component = 0;
    this.attribute = 0;
    this.entities = [];
    this.page = 0;
    this.menu = [];
    this.ui = document.createElement('a-entity');
    this.ui.setAttribute('position', {x: 0.04, y: 0.04, z: 0});
    this.ui.setAttribute('rotation', {x: -80, y: 0, z: 0});
    
    this.uiTitle = document.createElement('a-entity');
    this.uiTitle.setAttribute('text', {
      value: 'Tweaker',
      color: '#ff0',
      width: 0.45,
      align: 'left',
      anchor: 'left',
    });
    this.uiTitle.setAttribute('position', {x: 0, y: 0.035, z: 0.01});
    this.ui.appendChild(this.uiTitle);

    this.uimenu = document.createElement('a-entity');
    this.ui.appendChild(this.uimenu);

    var left= document.createElement('a-entity');
    left.setAttribute('tracked-controls', {controller: 0, idPrefix: 'OpenVR'});
    left.setAttribute('geometry', {primitive: 'sphere', radius: 0.03});
    left.setAttribute('material', {transparent: true, opacity: 0.3, color: '#000'});
    left.appendChild(this.ui);
    this.el.sceneEl.appendChild(left);
    this.axis = {x: 0, y: 0};
    left.addEventListener('buttondown', this.buttonDown.bind(this));
    left.addEventListener('buttonup', this.buttonUp.bind(this));
    left.addEventListener('axismove', this.axisMove.bind(this));

    var rightp = document.createElement('a-entity');
    rightp.setAttribute('menupicker');
    
    var right = document.createElement('a-entity');
    right.setAttribute('tracked-controls', {controller: 1, idPrefix: 'OpenVR'});
    right.setAttribute('geometry', {primitive: 'sphere', radius: 0.01});
    right.setAttribute('material', {transparent: true, opacity: 0.3, color: '#a00'});
    right.setAttribute('raycaster', {objects: '.tweak_menuitem', showLine: true, far: 0.5});
    rightp.appendChild(right);
    this.el.sceneEl.appendChild(rightp);


    this.on = false;
    this.dragging = false;
  },

  addMenuItem: function(idx, label){
    var bg = document.createElement('a-entity');
    bg.setAttribute('geometry', { 
      primitive: 'plane', 
      width: 0.16,
      height: 0.02
    });
    bg.setAttribute('material', {
      transparent: true,
      opacity: 0.6,
      color: '#000'
    });
    bg.setAttribute('position', {x: 0.076, y: -0.001, z: -0.001});
    bg.classList.add('tweak_menuitem');

    var item = document.createElement('a-entity');
    item.setAttribute('text', {
      value: label,
      width: 0.4,
      align: 'left',
      anchor: 'left',
    });
    item.setAttribute('position', {x: 0, y: -idx * 0.02, z: 0})
    item.appendChild(bg);
    return item;
  },
  
  addEntity: function(entity){
    var components = [];
    for(var c in entity.components) if (c != 'tweak') components.push(c);
    this.entities.push({el: entity, comps: components});

    var menu = {el : null, childrenEl: null, children: []};
    menu.el = this.addMenuItem(this.entities.length - 1, entity.id ? entity.id : entity.tagName.toLowerCase());
    menu.el.classList.add('rootmenuitem');
    menu.childrenEl = document.createElement('a-entity');
    menu.childrenEl.setAttribute('visible', false);
    this.uimenu.appendChild(menu.childrenEl);

    for (var i = 0; i < components.length; i++) {
      var item = {el: this.addMenuItem(i, components[i]), childrenEl: null, children: []};

      item.childrenEl = document.createElement('a-entity');
      item.childrenEl.setAttribute('visible', false);
      this.uimenu.appendChild(item.childrenEl);

      var attrs = this.getAttributeList(entity.components[components[i]]);
      for (var j = 0; j < attrs.length; j++) {
        var item2 = {el: this.addMenuItem(j, attrs[j]), childrenEl: null, children: []};
        item.children.push(item2);
        item.childrenEl.appendChild(item2.el);
      }

      menu.children.push(item);
      menu.childrenEl.appendChild(item.el);
    }

    this.menu.push(menu);
    this.uimenu.appendChild(menu.el);
    this.refreshUI();
  },
  
  changePage: function(delta){
    this.page += delta; 
    if (this.page < 0) this.page = 0;
    if (this.page > 2) this.page = 2;
  },
  
  scroll: function(delta){
    switch(this.page){
      case 0: 
        this.changeEntity(delta);
        break;
      case 1: 
        this.changeComponent(delta);
        break;
      case 2: 
        this.changeAttribute(delta);
        break;
    }
  },
  
  changeEntity: function(delta){
    this.entity += delta;
    if (this.entity >= this.entities.length) this.entity = 0;
    if (this.entity < 0) this.entity = this.entities.length - 1;
    this.component = 0;
  },
  
  changeComponent: function(delta){
    var total = this.entities[this.entity].comps.length;
    this.component += delta;
    if (this.component >= total) this.component = 0;
    if (this.component < 0) this.component = total - 1;
    this.attribute = 0;
  },
  
  changeAttribute: function(delta){
    this.attribute += delta;
    var attrs = this.getAttributeList();
    if (this.attribute >= attrs.length) this.attribute = 0;
    if (this.attribute < 0) this.attribute = attrs.length - 1;
  },
  
  getEntity: function(){
    return this.entities[this.entity].el;
  },
  
  getComponent: function(){
    var e = this.entities[this.entity];
    return e.el.components[e.comps[this.component]];
  },
  
  getAttributeList: function(component){
    var i = 0;
    var comp = component || this.getComponent();
    if (['position', 'rotation', 'scale'].indexOf(comp.name) != -1) return [comp.name];
    else if (typeof(comp.data) != 'object') return [comp.name];
    var attrs = [];
    for(var a in comp.data) attrs.push(a);
    return attrs;
  },
  
  axisMove: function(ev){
    this.axis.x = ev.detail.axis[0];
    this.axis.y = ev.detail.axis[1];
  },
  
  buttonDown: function(ev){
    if (ev.detail.id == 0){
      var button = ''; 
      var ax = Math.abs(this.axis.x);
      var ay = Math.abs(this.axis.y);
      if (this.axis.x > 0.5 && ax > ay) button = 'right';
      else if (this.axis.x < -0.5 && ax > ay) button = 'left';
      else if (this.axis.y > 0.5 && ay > ax) button = 'up';
      else if (this.axis.y < -0.5 && ay > ax) button = 'down';
      else button = 'center';
      
      if (button == '') return;

      if (button == 'center'){ 
        this.on = !this.on;
        this.ui.setAttribute('visible', this.on);
        if (!this.on) return;
      }
      else switch (button){
        case 'left':  this.changePage(-1); break;
        case 'right': this.changePage(1);  break;
        case 'up':    this.scroll(-1); break;
        case 'down':  this.scroll(1);  break;
      }
      this.refreshUI();
    }
  },
  
  buttonUp: function(ev){
    if (ev.detail.id == 0){
      this.dragging = false;
    }
  },
  
  refreshUI: function(){
    var i, menuitems;
    for (i = 0; i < this.uimenu.children.length; i++) {
      var child = this.uimenu.children[i];
      if (child.classList.contains('rootmenuitem')) {
        child.setAttribute('visible', this.page == 0);
      }
      else { child.setAttribute('visible', false); }
    }

    switch(this.page){
      case 0:
        for (i = 0; i < this.menu.length; i++) {
          this.menu[i].el.setAttribute('text', {opacity: i == this.entity ? 1 : 0.4})
        }
        this.uiTitle.setAttribute('text', {value: ''});
        console.log(this.getEntity().id);
        break;
      case 1: 
        menuitems = this.menu[this.entity].children;
        this.menu[this.entity].childrenEl.setAttribute('visible', true);
        for (i = 0; i < menuitems.length; i++) {
          menuitems[i].el.setAttribute('text', {opacity: i == this.component ? 1 : 0.4})
        }
        this.uiTitle.setAttribute('text', {value: this.getEntity().id});
        console.log(this.getEntity().id + '.' + this.getComponent().name);
        break;
      case 2: 
        menuitems = this.menu[this.entity].children[this.component].children;
        this.menu[this.entity].children[this.component].childrenEl.setAttribute('visible', true);
        for (i = 0; i < menuitems.length; i++) {
          menuitems[i].el.setAttribute('text', {opacity: i == this.attribute ? 1 : 0.4})
        }
        this.uiTitle.setAttribute('text', {value: this.getEntity().id + '.' + this.getComponent().name});
        console.log(this.getEntity().id + '.' + this.getComponent().name + '.' + this.getAttributeList()[this.attribute]);
        break;
    }
  }
});

AFRAME.registerComponent('tweak', {
  schema: {
  },
  
  init: function(){
    this.system.addEntity(this.el);
  }
});


AFRAME.registerComponent('menupicker', {
  dependencies: ['raycaster'],
  init: function(){
    this.el.addEventListener('raycaster-intersection', function (ev) {
      console.log(ev.detail.els);
    });
  }
});