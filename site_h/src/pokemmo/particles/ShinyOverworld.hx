package pokemmo.particles;
import pokemmo.entities.CPokemon;
import pokemmo.GameObject;
import pokemmo.Map;
import pokemmo.Particle;
import UserAgentContext;


/**
 * ...
 * @author Matheus28
 */

class ShinyOverworld extends Particle{
	
	private var particles:Float32Array;
	
	/*
	float struct {
		x;
		y;
		alpha;
		velX;
		velY;
	};
	*/
	
	static inline private var PARTICLE_STRUCT_SIZE:Int = 5;
	static inline private var NUM_PARTICLES:Int = 100;
	
	public var obj:GameObject;
	
	public function new(obj:GameObject) {
		super();
		
		this.obj = obj;
		particles = new Float32Array(NUM_PARTICLES * PARTICLE_STRUCT_SIZE);
		
	}
	
	override public function destroy():Void {
		super.destroy();
		
		particles = null;
	}
	
	override public function render(ctx:CanvasRenderingContext2D):Void {
		ctx.fillStyle = '#FFFF00';
		ctx.globalCompositeOperation = 'lighter';
		
		var map = Map.cur;
		var i = NUM_PARTICLES;
		while (i-- > 0) {
			var x:Float = particles[i * PARTICLE_STRUCT_SIZE + 0];
			var y:Float = particles[i * PARTICLE_STRUCT_SIZE + 1];
			var alpha:Float = particles[i * PARTICLE_STRUCT_SIZE + 2];
			
			if (alpha <= 0.03) {
				if (!started) continue;
				if(Math.random() < 0.05){
					alpha = 1.0;
					x = Math.random() * 16 - 8;
					y = Math.random() * 16 - 8;
					
					particles[i * PARTICLE_STRUCT_SIZE + 3] = x / 8 * 2;
					particles[i * PARTICLE_STRUCT_SIZE + 4] = y / 8 * 2;
					
					x += (obj.x * map.tilewidth + map.tilewidth / 2);
					y += (obj.y * map.tileheight + map.tileheight / 2);
				}
			}else {
				alpha *= 0.90;
				x += (particles[i * PARTICLE_STRUCT_SIZE + 3] *= 0.9);
				y += (particles[i * PARTICLE_STRUCT_SIZE + 4] *= 0.9);// + 0.4;
			}
			
			ctx.globalAlpha = alpha;
			ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
			
			particles[i * PARTICLE_STRUCT_SIZE + 0] = x;
			particles[i * PARTICLE_STRUCT_SIZE + 1] = y;
			particles[i * PARTICLE_STRUCT_SIZE + 2] = alpha;
		}
	}
}