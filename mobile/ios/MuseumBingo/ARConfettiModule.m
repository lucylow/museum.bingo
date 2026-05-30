#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(ARConfettiModule, NSObject)

RCT_EXTERN_METHOD(startConfettiWithPlaneDetection:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(startConfetti:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(stopConfetti)

@end
