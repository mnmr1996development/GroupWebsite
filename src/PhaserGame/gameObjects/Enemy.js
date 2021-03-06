import Phaser from 'phaser';
import { Bullet } from "./Projectiles";
import { emptyBar, HpBar, ManaBar } from "./StatusBar";
import * as firebase from 'firebase';
    /**
     * The Enemy class.
     * The class where the properties of the enemy units are generated.
     * Including enemy behavior, enemy attacking,auto target finding and
     * several other standard functions.
     */
export class Enemy extends Phaser.Physics.Arcade.Sprite{
    /**
     * 
     * sets up the Enemy object. calls createAttack, setupMovement.
     * Prepare the behavior and properties of enemy to be later add the scene.
     * 
     * @param {Phaser.Scene} scene - The Scene that the Enemy is going to be in
     * @param {number} x - The X axis position of the Enemy in the scene
     * @param {number} y - The Y axis poistion of the Enemy in the scene
     * @param {string} key - The key of the Enemy object for phaser
     * @param {string} textureName - The name of the texture that is used for the Enemy
     * @param {number} enemyID - The specific Enemy type of the Enemy
     * @param {number} healthPoints - The health that the Enemy will have in the game
     * @param {number} attackRate - The speed of the bullets that the Enemy will shoot
     * @param {number} ATK - The attack power that the Enemy has.
     * @param {number} attackRange - The range that the Enemy can attack a target
     * @param {number} movementSpeed - The speed that the Enemy moves 
     * @param {number} cooldown - The cooldown restriction that the Enemy can perform next attack
     * @param {string} uid - The unique id of Enemy object which is same as the player who created the enemy.
     */
    constructor(scene,x,y,key,textureName,target,enemyID=null,healthPoints = 50,attackRate=0.8,ATK=5,attackRange=180,movementSpeed=60,cooldown=600,uid='233', selfID='233'){
        super(scene,x,y,key,textureName,target);

        //adds to the scenes update and display list
        scene.sys.updateList.add(this);
        scene.sys.displayList.add(this);
        //this.setOrigin(0,0);
        this.building=scene.building;
        this.university=scene.university;
        this.pyramid=scene.pyramid;
        this.magicstone=scene.magicstone;
        this.sword_in_the_stone=scene.sword_in_the_stone;
        this.selfID = selfID;
        this.singleplayer=scene.player;
        this.gameroom = '';
      
        /**
         * The array that has the list of the towers
         * @name Enemy#towers
         * @type array
         */
        this.towers=[this.pyramid,this.university,this.magicstone,this.building];
        this.enemyID=enemyID;
        /**
         * The counts that compares to time to check the enemy can attack
         * @name Enemy#timeCycle
         * @type number
         */
        this.timeCycle=0;
        this.cooldown=cooldown;
        scene.updateSprite(this); 
        this.createAttack(scene);
        //enable body in physics game
        scene.physics.world.enableBody(this);
        /**
         * True or false that says if the Enemy is being attacked
         * @name Enemy#beingAttacked
         * @type boolean
         */
        this.beingAttacked=false;

        /**
         * The scale of the Enemy bullets
         * @name Enemy#bulletscale
         * @type number
         */
        this.bulletscale=0.15;
        
        /**
         * value from the scene that tells the enemy what type of scene we are in. 
         * @name Enemy#mode
         * @type string
         */
        this.mode = scene.mode;
        //Health
        this.healthPoints = healthPoints; 
        this.tintcolor=0xffffff;
        this.tint=this.tintcolor;
        /**
         * The bullet texture of the Enemy 
         * @name Enemy#bulletTexture
         * @type string
         */
        this.bulletTexture="shoot3";

        //Attack Speed and movementSpeed
        this.uid = uid;

        //Attack Speed
        this.attackRate = attackRate;
        this.movementSpeed=movementSpeed;
        //this.demonskill=scene.add.sprite(40, 0, 'a2_01')
        //this.demonskill.play('ab2');
        //this.scene.physics.world.enableBody(this.demonskill);
        //Attack power
        this.ATK = ATK;
        
        //Attack Range
        //this.distance = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
        this.attackRange=attackRange;

        //setup the movement of the enemy
        this.target=target;
        this.setupMovement(scene,this.target);
        this.setVisible = false;
        this.body.immvoable = true;
        this.setCollideWorldBounds(true);
        

    }

    assignSelfID(id,key){
        this.selfID = id;
        this.gameroom = key;
    }

     /**
      * Function to assign new target to the enemy object
      * The default target is assigned when the player is created
      * This Function updates the newtarget object to be the new target.
      * @param {object} newtarget - The new target that the enemy is assigned to
      */ 
    changetarget(newtarget){
        this.target=newtarget;
    }

    /**
     * Function that uses Phaser.Math.Distance.Between built-in function to find 
     * the distance between enemy and target.This function return the distance 
     * between these two objects so we can future compare to find the target with 
     * the shortest distance
     * @param {object} enemy - The enemy object that we want to compare to
     * @param {object} target - The target object that we want to find the distance with enemy
     */ 
    distance(enemy,target){
        let distance=Phaser.Math.Distance.Between(enemy.x, enemy.y, target.x, target.y);
        return distance;
    }

    /**
     * Function that set up the movement of the enemy. If the enemy can be moved, it applies
     * enemy behavior to it and calls moveToObject to let the enemy moves to the target
     * @param {Phaser.Scene} scene - The scene that the enemy is in
     * @param {object} target - The target object that we want the enemy to move to
     */ 
    setupMovement(scene,target){
        /**
         * (Function is created by the setupMovement function) 
         * 
         * sets up the movement funciton that is called by the update method.
         */ 
        this.moveEnemy = () =>{
            if(this.movementSpeed!=0){
            this.EnemyBehavior(this,target);
            
            scene.physics.moveToObject(this,this.target,this.movementSpeed);}
         
        };
    }
    /**
     * Function that set up the behavior of the enemy. The main goal of the enemy is
     * to destory the enemy towers, the findneartower function will return the tower 
     * with the shortest distance to enemy, and the enemy will move to that tower and 
     * attack it, if in the meantime the player with different uid than enemy is near
     * its attack range, it will try to attack the player, and if the player leave the 
     * enemy's attack range, the target will then assigned to the nearest tower.
     * 
     * @param {object} enemy - The enemy that we want to assign the behavior to
     * @param {object} target - The target object that we want the enemy to move to
     */ 

    EnemyBehavior(enemy,target){
        target=this.target;

        /**
         * (Function is created by the EnemyBehavior function) 
         * 
         * This function calls two random numbers, randNumber and randomdist
         * randNumber indicates the switch case direction that we want the enemy
         * to move to, randomdist is the distance that it will move.
         */ 
        this.randomMove = () =>{
        const randNumber = Math.floor((Math.random() * 5) + 1);
        const randomdist = Math.floor((Math.random() * 100) + 1);
        switch(randNumber) {
          case 1: 
            enemy.setPosition(target.x+randomdist,target.y+randomdist); 
            break;
          case 2:
            enemy.setPosition(target.x+randomdist,target.y-randomdist); 
            break;
          case 3:
           enemy.setPosition(target.x-randomdist,target.y+randomdist);
            break;
          case 4:
           enemy.setPosition(target.x-randomdist,target.y-randomdist); 
            break;
          case 5:
           enemy.setPosition(target.x,target.y); 
            break;
        } };    
      /*  //if the enemy collide with other enemy or player, it will move to other direction
        this.scene.physics.world.collide(enemy, target, (enemy,target)=>{
            if (target.uid!=enemy.uid){
                this.randomMove();}
            else if (target.uid===enemy.uid){
                enemy.body.immovable=false;
               // enemy.body.moves=true;
            }
            },null,this);*/
       
        this.scene.physics.add.overlap(enemy, enemy, this.randomMove, null, this);
        this.scene.physics.add.overlap(enemy, target, this.randomMove, null, this);
  
        /**      
         * (Function is created by the EnemyBehavior function) 
         * 
         * Function that finds the neartest tower and assign it to be the target of 
         * enemy. If it is single mode, the target will be the sword_in_the_stone.
         * Otherwise, it will find the tower with the shortest distance using distance 
         * function for the tower array.
         */ 
        //set up the findneartower function which finds the nearest tower to attack
        let shortestDistance=1000000000;
        this.findneartower = () =>{
            
  
            //this.scene.enemies.getChildren().map(child => this.towers.push(child));  
          //  this.towers.push(this.scene.player)
            for (var i = 0; i < this.towers.length; i++) {
                if(this.towers[i].active && this.towers[i].uid!=enemy.uid){
                    let towerdistance=this.distance(enemy,this.towers[i]);
                     if (towerdistance<shortestDistance){
                        shortestDistance=towerdistance;      
                        this.changetarget(this.towers[i]);}
            }
        } }; 
 
        if( this.scene.otherPlayers !== undefined && Object.keys(this.scene.otherPlayers).length > 0){
            this.enemyplayers = this.scene.otherPlayers;
            this.enemyplayers.self = this.scene.player1;
            this.enemyplayerid = Object.keys(this.scene.otherPlayers);

            for( let i = 0; i < this.enemyplayerid.length; i++ ){
                let player = this.enemyplayers[this.enemyplayerid[i]];
                if(Math.abs(player.x - enemy.x) < this.attackRange+30 && Math.abs(player.y - enemy.y) < this.attackRange+30){
                    if(player.active && player.uid!=enemy.uid){
                        this.changetarget(player);
                        break;
                    }
                    else{
                        this.findneartower();}
                }
        
                else{     
                    this.findneartower();}
            }
        }
        else this.findneartower();
        
        if(this.mode === 'single'){
            this.towers.push(this.sword_in_the_stone);
            let player=this.scene.player;
            if(Math.abs(target.x - enemy.x) < this.attackRange && Math.abs(target.y - enemy.y) < this.attackRange){
                this.movementSpeed=this.movementSpeed+1;}

            if(this.movementSpeed>=player.movementSpeed-10){
                this.movementSpeed=65;}
            if(Math.abs(player.x - enemy.x) < this.attackRange+20 && Math.abs(player.y - enemy.y) < this.attackRange+20){
                if(player.active&&player.uid!=enemy.uid)
                this.changetarget(player);}
                else{     
                    this.findneartower();}}}
           
    /**
     * Function to remove the enemy so we can handle other things related to the death such as stop the attack 
     * also when in the multiplayer mode it will detect which player kills this enemy
     * @param {Boolean} firstDeath - determine if this is the first time the method get called so we don't duplicate the database action
     * @param {String} attackeruid - the uid of the player who attacks the enemy
     *    
     */
    kill(firstDeath=true, attackeruid){
        if(this.gameroom !== '' && firstDeath){
            firebase.database().ref(`Games/${this.gameroom}/enemies/${this.selfID}`).transaction( snapShot =>{
                firebase.database().ref(`Games/${this.gameroom}/enemies/${this.selfID}`).update({
                    alive: false,
                    killerid: attackeruid
                })
            })
            /*firebase.database().ref(`Games/${this.gameroom}/enemies/${this.selfID}`).update({
                alive: false
            })*/
        };
        this.destroy();     
        
    } 

    /**
     * Function to damage the enemy by the the given number supplied to the funciton
     * If the ending healthpoints is less than 0 it calls the kill function
     * 
     * @param {number} damage - the amount of damage the enemy should take
     * @param {String} attackeruid - the uid of the player who attacks this enemy
     */
    takeDamage(damage, attackeruid){
        this.healthPoints = this.healthPoints - damage;
       
        if( this.healthPoints <= 0 ){
           
            if(this.scene.mode ==='single'){
                if(this.scene.player.active&&this.sword_in_the_stone.active){
                this.scene.player.healthPoints+=20;
                this.scene.player.mana+=15;
                this.sword_in_the_stone.healthPoints+=20;
                this.scene.hpbar.regenHPBar(20);
                this.scene.manabar.regenManaBar(15);
                this.sword_in_the_stone.building_bar.regenHPBar(20);
                this.kill();}}
            /*
            else if(this.scene.mode ==='multi'){
                if(this.scene.player1.active){
                this.scene.player1.healthPoints+=20;
                this.scene.hpbar.regenHPBar(10);
                this.kill();}}*/
                else{
                    this.kill(true, attackeruid);
                }
        }
    }
    
    /**
     * collision function that is called when a collision occurs to the enemy. 
     * calls the takeDamage function and change being attacked status to true
     * 
     * @param {String} attackeruid - the uid of the player who attacks this enemy
     */
    collision( attackeruid ){
        this.takeDamage(20,attackeruid);
        this.beingAttacked=true;
  
    }
    
    /**
     * changes tint and canbeAttacked based on the time passed into the funciton
     * if beingAttacked is true it tints the enemy red and sets the count ot the current time
     * 
     * @param {number} time - The time that is used to determine how long the enemy should be tinted
     */
    isInjured(time){
        if(this.beingAttacked===true){
            this.tint=0xff0000;
            this.count=time;
        }
        else{
            if(time>this.count+1000)
            {this.tint=this.tintcolor;}

        }
    }
    /**
     * Function to apply walking, shooting animations of the movement of the enemy.
     * The animation plays based upon the direction that the enmey moves, and the type
     * of the enemy. This function also handles the special attack style when for different
     * enemy type. For example, when the hp of the wolf is down to certain point, it will
     * turn into a werewolf and the attackrate and atackrange will increase.
     */
    enemymovement(){
        
        //movement for wolf
        if(this.enemyID===0){
            this.bulletTexture="shoot5";
            if(this.healthPoints>=110){
                if(this.body.velocity.x > 0 && this.body.velocity.y > 0){
                    this.play('wolf_down',true);
                }else if(this.body.velocity.x > 0 && this.body.velocity.y < 0){
                    this.play('wolf_right',true);
                }else if(this.body.velocity.x < 0 && this.body.velocity.y > 0){
                    this.play('wolf_left',true);
                }else if(this.body.velocity.x < 0 && this.body.velocity.y < 0){
                    this.play('wolf_up',true);       
                }}
     
            else{
                this.attackRate=0.8;
                this.attackRange=300;
                this.cooldown=40;
                if(this.body.velocity.x > 0 && this.body.velocity.y > 0){
                    this.play('werewolf_down',true);
                }else if(this.body.velocity.x > 0 && this.body.velocity.y < 0){
                    this.play('werewolf_right',true);
                }else if(this.body.velocity.x < 0 && this.body.velocity.y > 0){
                    this.play('werewolf_left',true);
                }else if(this.body.velocity.x < 0 && this.body.velocity.y < 0){
                    this.play('werewolf_up',true);
            
                }}

            }
        
        //movement for ninjabot
        if(this.enemyID===1){
            this.bulletTexture="shoot6";
            this.bulletscale=0.5;
            if(this.body.velocity.x > 0 && this.body.velocity.y > 0){
                this.play('ninjabot_down',true);
            }else if(this.body.velocity.x > 0 && this.body.velocity.y < 0){
                this.play('ninjabot_right',true);
            }else if(this.body.velocity.x < 0 && this.body.velocity.y > 0){
                this.play('ninjabot_left',true);
            }else if(this.body.velocity.x < 0 && this.body.velocity.y < 0){
                this.play('ninjabot_up',true);
        
            }
        }
        if(this.enemyID===2){
            this.bulletTexture="shoot7";
            /*
            this.container= this.scene.add.container(200, 200);
            this.container.add(this.demonskill);  
            this.container.x=this.x;
            this.container.y=this.y;*/
           /* if(this.healthPoints<=0){
                this.container.getChildren().map(child => child.destroy());
            }*/
            if(this.body.velocity.x > 0 && this.body.velocity.y > 0){
                this.play('demon1_down',true);
            }else if(this.body.velocity.x > 0 && this.body.velocity.y < 0){
                this.play('demon1_right',true);
            }else if(this.body.velocity.x < 0 && this.body.velocity.y > 0){
                this.play('demon1_left',true);
            }else if(this.body.velocity.x < 0 && this.body.velocity.y < 0){
                this.play('demon1_up',true);
          
            }
            if(this.healthPoints<120){
                this.movementSpeed=120;
                this.setScale(2);
                this.bulletscale=0.8;
                this.attackRate=1;
                this.cooldown = 50;
            }
        }
        if(this.enemyID===3){
            this.bulletTexture="shoot8";
            this.bulletscale=0.6;
            if(this.body.velocity.x > 0 && this.body.velocity.y > 0){
                this.play('skull_down',true);
            }else if(this.body.velocity.x > 0 && this.body.velocity.y < 0){
                this.play('skull_right',true);
            }else if(this.body.velocity.x < 0 && this.body.velocity.y > 0){
                this.play('skull_left',true);
            }else if(this.body.velocity.x < 0 && this.body.velocity.y < 0){
                this.play('skull_up',true);
        
            }
        }

    }
    /**
     * Intializes the weapon of the enempy so that the enemy can shoot.
     * It creates the bullets which is added to the scene.
     * Including the basicattack function and removeDefense funciton for the enemy.
     * @param {Phaser.Scene} scene - The scene that the enemy is inside that is used to create the bullet group
     */
    createAttack(scene){
        this.bullets = scene.physics.add.group({classType: Bullet, runChildUpdate: true});
        /**
         * (Function is created by the createAttack function)
         * 
         * calling basicattack will shoot a bullet in the direction that the enemy is facing. 
         */
        this.basicattack = (target)=>{
            let bullet = this.bullets.get();
            bullet.speed=this.attackRate;
            scene.enemiesAttacks.add(bullet);
            bullet.shoot(this.uid,this,target,true);
            bullet.setPosition(this.x,this.y);
            bullet.setTexture(this.bulletTexture).setScale(this.bulletscale).setSize(32,30);
        };
        /**
         * calling removeDefense destroys the weapon used by the enemy sets attack back to null
         */
        this.removeDefense = ()=>{ //destroys the weapon used
            this.bullets.destroy();
            this.basicattack = null;
        };    

    }
    /**
     * Function to let the enemy shoot correct target if the target is in its attack range.
     * The attack of the enemy will have a cooldown that is assigned to it.
     * When the attack range,cooldown are fine, the enemy is ready to attack the target.
     * @param {object} enemy - The enemy that we will perform the attack function.
     * @param {object} target - The target that the enemy will attack.
     * @param {number} time - The time passes to keep track of whether the cooldown is fine.
     */
    enemyAttack(enemy,target,time){
        if(target.active&&target.uid!=enemy.uid){
         if (Math.abs(target.x - enemy.x) < this.attackRange && Math.abs(target.y - enemy.y) < enemy.attackRange){
            let distance=Phaser.Math.Distance.Between(enemy.x, enemy.y, target.x, target.y);
            let vX = (target.x - enemy.x)/distance;
            let vY = (target.y - enemy.y)/distance;
            if(this.timeCycle < time){
            this.basicattack({x: vX,y: vY});
            this.timeCycle = time + this.cooldown ;}
    }}
}

   /**
    * The update method that gets called by the playscene 60 times a second.
    * Handles isInjured and enemy animation,enemymovement,moveEnemy and enemyAttack.
    * 
    * @param {number} time - Time that gets passed by Phaser when update is called
    */
    update(time){
        
        this.isInjured(time);
        this.beingAttacked=false;
        //We can add a check so if the enemy is within a certain distance of a player it can launch an attack.

        this.enemymovement();
        this.moveEnemy();
        this.enemyAttack(this,this.target,time);

        }
    
    }
    