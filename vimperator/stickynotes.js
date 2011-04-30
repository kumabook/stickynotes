/**

 vimperator plugin for stickynotes


*/




commands.addUserCommand(['focus_stickies_sidebar','fsts'],'Focus Stickies Sidebar',Sticky_util.focusSidebar);
mappings.addUserMap(modes.NORMAL, ["d"], "focus sticky side bar map" , function() {
				
				try{	
						Side_bar_sticky.delete();
				} catch(e){
				window.content.document.window.close();
				}
				}	, {flags:true});
mappings.addUserMap(modes.NORMAL, ["j"], "sticky jump map" , function(){
				try{
						Sticky_util.jump();
				} catch(e){

			liberator.plugins.smooziee.smoothScrollBy(400);


				}	
				}, {flags:true});
commands.addUserCommand(['jump_sticky','justi'],'Jump Sticky',function(){
				
				Sticky_util.jump();
				}	
				
				);

